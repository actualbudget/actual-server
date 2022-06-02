
CREATE TABLE auth
  (password TEXT PRIMARY KEY);

CREATE TABLE sessions
  (token TEXT PRIMARY KEY);

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

CREATE TABLE webTokens
   (user_id TEXT PRIMARY KEY,
   token_id TEXT,
   time_created TEXT,
   contents TEXT);

CREATE TABLE access_tokens
   (item_id TEXT PRIMARY KEY,
   user_id TEXT,
   access_token TEXT,
   deleted BOOLEAN);
