export const applyPatterns = (transaction, patternsConfig) => {
  const transactionCode = transaction.proprietaryBankTransactionCode;

  // Filter all applicable pattern groups, including 'any'
  const applicablePatternGroups = patternsConfig.filter(
    (patternGroup) =>
      patternGroup.transactionCode === 'any' ||
      patternGroup.transactionCode === transactionCode,
  );

  if (applicablePatternGroups.length === 0) return transaction;

  // minus sign is typically used to denote debit, so check for absence of minus sign for credit
  const isCredited = transaction.transactionAmount.amount.charAt(0) !== '-';

  const updatedTransaction = { ...transaction };

  applicablePatternGroups.forEach((patternGroup) => {
    patternGroup.patterns.forEach((pattern) => {
      const fieldName = isCredited
        ? pattern.targetField.credited
        : pattern.targetField.debited;

      let fieldValue;

      if (pattern.sourceField) {
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
