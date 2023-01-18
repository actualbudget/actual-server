# Integration new bank

Find in [doc](https://docs.google.com/spreadsheets/d/1ogpzydzotOltbssrc3IQ8rhBLlIZbQgm5QCiiNJrkyA/edit#gid=489769432) what is id of bank which you want to integrate

Add the `institution_id` and your name to list of possible options in the frontend project `actual/packages/loot-design/src/components/modals/NordigenExternalMsg.js`

```
<Strong>Choose your banks:</Strong>
<CustomSelect
  options={[
    ['default', 'Choose your bank'],
    ['ING_PL_INGBPLPW', 'ING PL'],
    ['MBANK_RETAIL_BREXPLPW', 'MBANK'],
    ['SANDBOXFINANCE_SFIN0000', 'DEMO - TEST']
  ]}
```

Launch frontend and backend server

Create new linked account and select institution which you added recently. 

Find in the server logs message `Available account properties for new institution integration`. In this log messages you can find available data for your account.
Based on it create new class for bank in file `banks.js` with `normalizeAccount` function. You have there available data from the log message.

example redacted log message: 
```log
Available account properties for new institution integration {
  account: '{"iban":"PL00000000000000000987654321","currency":"PLN","ownerName":"John Example","displayName":"Product name","product":"Daily account","usage":"PRIV","ownerAddressUnstructured":["POL","UL. Example 1","00-000 Warsaw"],"id":"XXXXXXXX-XXXX-XXXXX-XXXXXX-XXXXXXXXX","created":"2023-01-18T12:15:16.502446Z","last_accessed":null,"institution_id":"MBANK_RETAIL_BREXPLPW","status":"READY","owner_name":"","institution":{"id":"MBANK_RETAIL_BREXPLPW","name":"mBank Retail","bic":"BREXPLPW","transaction_total_days":"90","countries":["PL"],"logo":"https://cdn.nordigen.com/ais/MBANK_RETAIL_BREXCZPP.png","supported_payments":{},"supported_features":["access_scopes","business_accounts","card_accounts","corporate_accounts","pending_transactions","private_accounts"]}}'
}
```

example bank class:
```javascript
class MbankRetailBrexplpw{
  static institutionId = 'MBANK_RETAIL_BREXPLPW';

  constructor(options) {
  }

  /**
   * Returns normalized object with required data for the frontend
   * @param {DetailedAccount&{institution: Institution}} account
   * @returns {NormalizedAccountDetails}
   */
  normalizeAccount = (account) => {
    return {
      account_id: account.id, // Shouldn't be modified
      institution: account.institution, // Shouldn't be modified
      mask: account.iban.slice(-4), // Change if iban is not availaible for your bank. returns 4321
      name: [account.displayName, printIban(account)].join(' '), // returns  Product name (XXX 4321)
      official_name: account.product,
      type: 'checking'
    }
  }
}
```

As a `institutionId` you have use institution from the log message located in the property `institution_id`

These data are stored in DB in the `accounts` table. Description of the fields:
| field         | description                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| account_id    | Id of the account from Nordigen. The Actual use it to auto-match account when access to the account will expire and you need to link account again. |
| institution   | Institution object returned from Nordigen. We get from there bank name which is located in the banks table                                      |
| mask          | last 4 digits fro iban or some number of the account (should be unique in your accounts)                                                            |
| name          | Name for you account in the app -- you can later modify it in application                                                                           |
| official_name | ???                                                                                                                                                 |
| type          | one of the account types supported by Actual                                                                                                        | 
