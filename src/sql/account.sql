CREATE TABLE auth
  (method TEXT PRIMARY KEY,
   extra_data TEXT);

CREATE TABLE sessions
  (token TEXT PRIMARY KEY);

CREATE TABLE pending_openid_requests
  (state TEXT PRIMARY KEY,
   code_verifier TEXT,
   return_url TEXT,
   expiry_time INTEGER);

CREATE TABLE files
  (id TEXT PRIMARY KEY,
   group_id TEXT,
   sync_version SMALLINT,
   encrypt_meta TEXT,
   encrypt_keyid TEXT,
   encrypt_salt TEXT,
   encrypt_test TEXT,
   deleted BOOLEAN DEFAULT FALSE,
   name TEXT);
