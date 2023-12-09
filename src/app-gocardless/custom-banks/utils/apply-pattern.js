export const isCreditedTransaction = (transaction) => {
  const transAmount = transaction.transactionAmount.amount;
  return transAmount > 0 || Object.is(Number(transAmount), 0);
};

export const applyTransactionPatterns = (transaction, patternsConfig) => {
  const transactionCode =
    transaction?.proprietaryBankTransactionCode?.toUpperCase();

  // Filter all applicable pattern groups, including 'any'
  const applicablePatternGroups = patternsConfig.filter(
    (patternGroup) =>
      patternGroup.transactionCode === 'any' ||
      patternGroup.transactionCode.toUpperCase() == transactionCode,
  );

  if (applicablePatternGroups.length === 0) return transaction;

  const isCredited = isCreditedTransaction(transaction);

  let updatedTransaction = { ...transaction };

  applicablePatternGroups.forEach((patternGroup) => {
    patternGroup.patterns.forEach((pattern) => {
      const fieldName = isCredited
        ? pattern.targetField.credited
        : pattern.targetField.debited;

      let fieldValue;

      if (pattern?.sourceField) {
        // Handle mappings
        fieldValue = updatedTransaction[pattern.sourceField];
      } else {
        // Handle transformations
        fieldValue = updatedTransaction[fieldName];
      }

      if (fieldValue) {
        const match = fieldValue.match(pattern.regex);
        if (match) {
          updatedTransaction[fieldName] = fieldValue
            .trim()
            .replace(pattern.regex, pattern.replacement)
            .trim();
        }
      }
    });
  });

  return updatedTransaction;
};

export const applyTransactionMapping = (transaction, descriptions) => {
  const description = descriptions[transaction.proprietaryBankTransactionCode];
  return description
    ? { ...transaction, remittanceInformationUnstructured: description }
    : transaction;
};

export const getTransactionDate = (transaction) =>
  transaction.bookingDate ||
  transaction.bookingDateTime ||
  transaction.valueDate ||
  transaction.valueDateTime;

export const toTitleCase = (str) =>
  str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();

export const normalizeCreditorAndDebtorNames = (transaction) => {
  const isCredited = isCreditedTransaction(transaction);

  let updatedTransaction = { ...transaction };
  if (isCredited) {
    if (!transaction.debtorName) {
      updatedTransaction.debtorName = transaction.creditorName || null;
      updatedTransaction.creditorName = null;
    }
  } else {
    if (!transaction.creditorName) {
      updatedTransaction.creditorName = transaction.debtorName || null;
      updatedTransaction.debtorName = null;
    }
  }

  return updatedTransaction;
};
