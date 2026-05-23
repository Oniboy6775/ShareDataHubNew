const Transaction = require("../Models/transactionModel");

const generateReceipt = async ({
  transactionId,
  planNetwork,
  status,
  planName,
  phoneNumber,
  amountToCharge,
  balance,
  userId,
  userName,
  type,
  volumeRatio = 0,
  costPrice,
}) => {
  const profit = amountToCharge - (costPrice || amountToCharge);
  const tx = new Transaction({
    trans_Id: transactionId,
    trans_By: userId,
    trans_UserName: userName,
    trans_Type: type,
    trans_Network: planNetwork,
    phone_number: phoneNumber,
    trans_amount: amountToCharge,
    balance_Before: balance,
    balance_After: balance - amountToCharge,
    trans_Status: status,
    trans_profit: profit,
    trans_volume_ratio: volumeRatio,
    trans_Date: `${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
    createdAt: Date.now(),
  });
  return tx.save();
};

module.exports = generateReceipt;
