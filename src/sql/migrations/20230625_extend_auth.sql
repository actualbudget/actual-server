CREATE TABLE auth_new
  (method TEXT PRIMARY KEY,
   extra_data TEXT);

INSERT INTO auth_new (method, extra_data)
  SELECT 'password', password FROM auth;
DROP TABLE auth;
ALTER TABLE auth_new RENAME TO auth;

CREATE TABLE pending_openid_requests
  (state TEXT PRIMARY KEY,
   code_verifier TEXT,
   return_url TEXT,
   expiry_time INTEGER);
