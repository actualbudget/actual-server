CREATE TABLE plaid_config
  (plaid_client_id TEXT PRIMARY KEY,
   plaid_secret TEXT,
   plaid_env TEXT);

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

-- INSERT INTO plaid_config (plaid_client_id, plaid_secret, plaid_env) VALUES ('', '', 'development');