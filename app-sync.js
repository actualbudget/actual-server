let fs = require('fs/promises');
let { Buffer } = require('buffer');
let uuid = require('uuid');
let { validateUser } = require('./util/validate-user');
let { getAccountDb } = require('./account-db');
let { getPathForUserFile, getPathForGroupFile } = require('./util/paths');
let { getKey } = require('./util/read-body');

let simpleSync = require('./sync-simple');

let actual = require('@actual-app/api');
let SyncPb = actual.internal.SyncProtoBuf;

/** @type {import('fastify').FastifyPluginCallback} */
module.exports = (fastify, opts, done) => {
  fastify.register(require('./util/error-plugin'));

  // This is a version representing the internal format of sync
  // messages. When this changes, all sync files need to be reset. We
  // will check this version when syncing and notify the user if they
  // need to reset.
  const SYNC_FORMAT_VERSION = 2;

  fastify.post('/sync', async (req, res) => {
    let user = validateUser(req, res);
    if (!user) {
      return;
    }

    let requestPb;
    try {
      requestPb = SyncPb.SyncRequest.deserializeBinary(req.body);
    } catch (e) {
      res.status(500);
      return { status: 'error', reason: 'internal-error' };
    }

    let accountDb = getAccountDb();
    let file_id = requestPb.getFileid() || null;
    let group_id = requestPb.getGroupid() || null;
    let key_id = requestPb.getKeyid() || null;
    let since = requestPb.getSince() || null;
    let messages = requestPb.getMessagesList();

    if (!since) {
      throw new Error('`since` is required');
    }

    let currentFiles = accountDb.all(
      'SELECT group_id, encrypt_keyid, encrypt_meta, sync_version FROM files WHERE id = ?',
      [file_id]
    );

    if (currentFiles.length === 0) {
      res.status(400);
      return 'file-not-found';
    }

    let currentFile = currentFiles[0];

    if (
      currentFile.sync_version == null ||
      currentFile.sync_version < SYNC_FORMAT_VERSION
    ) {
      res.status(400);
      return 'file-old-version';
    }

    // When resetting sync state, something went wrong. There is no
    // group id and it's awaiting a file to be uploaded.
    if (currentFile.group_id == null) {
      res.status(400);
      return 'file-needs-upload';
    }

    // Check to make sure the uploaded file is valid and has been
    // encrypted with the same key it is registered with (this might
    // be wrong if there was an error during the key creation
    // process)
    let uploadedKeyId = currentFile.encrypt_meta
      ? JSON.parse(currentFile.encrypt_meta).keyId
      : null;
    if (uploadedKeyId !== currentFile.encrypt_keyid) {
      res.status(400);
      return 'file-key-mismatch';
    }

    // The changes being synced are part of an old group, which
    // means the file has been reset. User needs to re-download.
    if (group_id !== currentFile.group_id) {
      res.status(400);
      return 'file-has-reset';
    }

    // The data is encrypted with a different key which is
    // unacceptable. We can't accept these changes. Reject them and
    // tell the user that they need to generate the correct key
    // (which necessitates a sync reset so they need to re-download).
    if (key_id !== currentFile.encrypt_keyid) {
      res.status(400);
      return 'file-has-new-key';
    }

    let { trie, newMessages } = simpleSync.sync(messages, since, group_id);

    // encode it back...
    let responsePb = new SyncPb.SyncResponse();
    responsePb.setMerkle(JSON.stringify(trie));
    newMessages.forEach((msg) => responsePb.addMessages(msg));

    res.header('Content-Type', 'application/actual-sync');
    res.header('X-ACTUAL-SYNC-METHOD', 'simple');
    res.send(Buffer.from(responsePb.serializeBinary()));
  });

  fastify.post('/user-get-key', (req, res) => {
    let user = validateUser(req, res);
    if (!user) {
      return;
    }

    let accountDb = getAccountDb();
    let fileId = getKey(req, 'fileId');

    let rows = accountDb.all(
      'SELECT encrypt_salt, encrypt_keyid, encrypt_test FROM files WHERE id = ?',
      [fileId]
    );
    if (rows.length === 0) {
      res.status(400);
      return 'file-not-found';
    }
    let { encrypt_salt, encrypt_keyid, encrypt_test } = rows[0];

    return {
      status: 'ok',
      data: { id: encrypt_keyid, salt: encrypt_salt, test: encrypt_test }
    };
  });

  fastify.post('/user-create-key', (req, res) => {
    let user = validateUser(req, res);
    if (!user) {
      return;
    }
    let accountDb = getAccountDb();
    let fileId = getKey(req, 'fileId');
    let keyId = getKey(req, 'keyId');
    let keySalt = getKey(req, 'keySalt');
    let testContent = getKey(req, 'testContent');

    accountDb.mutate(
      'UPDATE files SET encrypt_salt = ?, encrypt_keyid = ?, encrypt_test = ? WHERE id = ?',
      [keySalt, keyId, testContent, fileId]
    );

    return { status: 'ok' };
  });

  fastify.post('/reset-user-file', async (req, res) => {
    let user = validateUser(req, res);
    if (!user) {
      return;
    }
    let accountDb = getAccountDb();
    let fileId = getKey(req, 'fileId');

    let files = accountDb.all('SELECT group_id FROM files WHERE id = ?', [
      fileId
    ]);
    if (files.length === 0) {
      res.status(400);
      return 'User or file not found';
    }
    let { group_id } = files[0];

    accountDb.mutate('UPDATE files SET group_id = NULL WHERE id = ?', [fileId]);

    if (group_id) {
      try {
        await fs.unlink(getPathForGroupFile(group_id));
      } catch (e) {
        console.log(`Unable to delete sync data for group "${group_id}"`);
      }
    }

    return { status: 'ok' };
  });

  fastify.post('/upload-user-file', async (req, res) => {
    let user = validateUser(req, res);
    if (!user) {
      return;
    }

    let accountDb = getAccountDb();
    let name = decodeURIComponent(req.headers['x-actual-name'].toString());
    let fileId = req.headers['x-actual-file-id'];
    let groupId = req.headers['x-actual-group-id'] || null;
    let encryptMeta = req.headers['x-actual-encrypt-meta'] || null;
    let syncFormatVersion = req.headers['x-actual-format'] || null;

    let keyId =
      encryptMeta && typeof encryptMeta === 'string'
        ? JSON.parse(encryptMeta).keyId
        : null;

    if (!fileId) {
      throw new Error('fileId is required');
    }

    let currentFiles = accountDb.all(
      'SELECT group_id, encrypt_keyid, encrypt_meta FROM files WHERE id = ?',
      [fileId]
    );
    if (currentFiles.length) {
      let currentFile = currentFiles[0];

      // The uploading file is part of an old group, so reject
      // it. All of its internal sync state is invalid because its
      // old. The sync state has been reset, so user needs to
      // either reset again or download from the current group.
      if (groupId !== currentFile.group_id) {
        res.status(400);
        return 'file-has-reset';
      }

      // The key that the file is encrypted with is different than
      // the current registered key. All data must always be
      // encrypted with the registered key for consistency. Key
      // changes always necessitate a sync reset, which means this
      // upload is trying to overwrite another reset. That might
      // be be fine, but since we definitely cannot accept a file
      // encrypted with the wrong key, we bail and suggest the
      // user download the latest file.
      if (keyId !== currentFile.encrypt_keyid) {
        res.status(400);
        return 'file-has-new-key';
      }
    }

    if (!(req.body instanceof Buffer)) {
      res.status(400);
      return { status: 'error' };
    }

    try {
      await fs.writeFile(getPathForUserFile(fileId), req.body);
    } catch (err) {
      console.log('Error writing file', err);
      return { status: 'error' };
    }

    let rows = accountDb.all('SELECT id FROM files WHERE id = ?', [fileId]);
    if (rows.length === 0) {
      // it's new
      groupId = uuid.v4();
      accountDb.mutate(
        'INSERT INTO files (id, group_id, sync_version, name, encrypt_meta) VALUES (?, ?, ?, ?, ?)',
        [fileId, groupId, syncFormatVersion, name, encryptMeta]
      );
      return { status: 'ok', groupId };
    } else {
      if (!groupId) {
        // sync state was reset, create new group
        groupId = uuid.v4();
        accountDb.mutate('UPDATE files SET group_id = ? WHERE id = ?', [
          groupId,
          fileId
        ]);
      }

      // Regardless, update some properties
      accountDb.mutate(
        'UPDATE files SET sync_version = ?, encrypt_meta = ?, name = ? WHERE id = ?',
        [syncFormatVersion, encryptMeta, name, fileId]
      );

      return { status: 'ok', groupId };
    }
  });

  fastify.get('/download-user-file', async (req, res) => {
    let user = validateUser(req, res);
    if (!user) {
      return;
    }
    let accountDb = getAccountDb();
    let fileId = req.headers['x-actual-file-id'];

    // Do some authentication
    let rows = accountDb.all(
      'SELECT id FROM files WHERE id = ? AND deleted = FALSE',
      [fileId]
    );
    if (rows.length === 0) {
      res.status(400);
      return 'User or file not found';
    }

    let buffer;
    try {
      buffer = await fs.readFile(getPathForUserFile(fileId));
    } catch (e) {
      console.log(`Error: file does not exist: ${getPathForUserFile(fileId)}`);
      res.status(500);
      return 'File does not exist on server';
    }

    res.header('Content-Disposition', `attachment;filename=${fileId}`);
    return buffer;
  });

  fastify.post('/update-user-filename', (req, res) => {
    let user = validateUser(req, res);
    if (!user) {
      return;
    }
    let accountDb = getAccountDb();
    let fileId = getKey(req, 'fileId');
    let name = getKey(req, 'name');

    // Do some authentication
    let rows = accountDb.all(
      'SELECT id FROM files WHERE id = ? AND deleted = FALSE',
      [fileId]
    );
    if (rows.length === 0) {
      // res.status(500).send('User or file not found');
      // return;
      res.status(500);
      return 'User or file not found';
    }

    accountDb.mutate('UPDATE files SET name = ? WHERE id = ?', [name, fileId]);

    // res.send(JSON.stringify({ status: 'ok' }));
    return { status: 'ok' };
  });

  fastify.get('/list-user-files', (req, res) => {
    let user = validateUser(req, res);
    if (!user) {
      return;
    }

    let accountDb = getAccountDb();
    let rows = accountDb.all('SELECT * FROM files');

    return {
      status: 'ok',
      data: rows.map((row) => ({
        deleted: row.deleted,
        fileId: row.id,
        groupId: row.group_id,
        name: row.name,
        encryptKeyId: row.encrypt_keyid
      }))
    };
  });

  fastify.get('/get-user-file-info', (req, res) => {
    let user = validateUser(req, res);
    if (!user) {
      return;
    }
    let accountDb = getAccountDb();
    let fileId = req.headers['x-actual-file-id'];

    let rows = accountDb.all(
      'SELECT * FROM files WHERE id = ? AND deleted = FALSE',
      [fileId]
    );
    if (rows.length === 0) {
      res.send(JSON.stringify({ status: 'error' }));
      return;
    }
    let row = rows[0];

    return {
      status: 'ok',
      data: {
        deleted: row.deleted,
        fileId: row.id,
        groupId: row.group_id,
        name: row.name,
        encryptMeta: row.encrypt_meta ? JSON.parse(row.encrypt_meta) : null
      }
    };
  });

  fastify.post('/delete-user-file', (req, res) => {
    let user = validateUser(req, res);
    if (!user) {
      return;
    }
    let accountDb = getAccountDb();
    let fileId = getKey(req, 'fileId');

    accountDb.mutate('UPDATE files SET deleted = TRUE WHERE id = ?', [fileId]);
    return { status: 'ok' };
  });

  done();
};
