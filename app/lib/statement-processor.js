"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processStatement = void 0;
var db_1 = require("@/lib/db");
var s3_1 = require("@/lib/s3");
var ai_processor_1 = require("@/lib/ai-processor");
function processStatement(statementId) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __awaiter(this, void 0, void 0, function () {
        var aiProcessor, error_1, statement, signedUrl, fileResponse, extractedData, arrayBuffer, base64Content, csvContent, categorizedTransactions, insights, createdTransactions, _i, categorizedTransactions_1, catTxn, originalTxn, type, amount, txnType, categoryLower, descLower, category, transaction, error_2;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    _j.trys.push([0, 1, , 3]);
                    console.log("[Processing] Initializing AI processor for statement ".concat(statementId));
                    aiProcessor = new ai_processor_1.AIBankStatementProcessor();
                    return [3 /*break*/, 3];
                case 1:
                    error_1 = _j.sent();
                    console.error('[Processing] Failed to initialize AI processor:', error_1);
                    return [4 /*yield*/, db_1.prisma.bankStatement.update({
                            where: { id: statementId },
                            data: {
                                status: 'FAILED',
                                processingStage: 'FAILED',
                                errorLog: "Failed to initialize AI processor: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
                            }
                        }).catch(console.error)];
                case 2:
                    _j.sent();
                    throw error_1;
                case 3:
                    _j.trys.push([3, 31, , 33]);
                    return [4 /*yield*/, db_1.prisma.bankStatement.findUnique({
                            where: { id: statementId },
                            include: {
                                user: true,
                                businessProfile: true
                            }
                        })];
                case 4:
                    statement = _j.sent();
                    if (!statement) {
                        throw new Error('Statement not found');
                    }
                    console.log("[Processing] Starting processing for ".concat(statement.fileName, " (Business Profile: ").concat(((_a = statement.businessProfile) === null || _a === void 0 ? void 0 : _a.name) || 'None', ")"));
                    // Update status to processing
                    return [4 /*yield*/, db_1.prisma.bankStatement.update({
                            where: { id: statementId },
                            data: {
                                status: 'PROCESSING',
                                processingStage: 'EXTRACTING_DATA'
                            }
                        })];
                case 5:
                    // Update status to processing
                    _j.sent();
                    // Get file from S3
                    if (!statement.cloudStoragePath) {
                        throw new Error('No cloud storage path found');
                    }
                    console.log("[Processing] Downloading file from S3: ".concat(statement.cloudStoragePath));
                    return [4 /*yield*/, (0, s3_1.downloadFile)(statement.cloudStoragePath)];
                case 6:
                    signedUrl = _j.sent();
                    return [4 /*yield*/, fetch(signedUrl)];
                case 7:
                    fileResponse = _j.sent();
                    if (!fileResponse.ok) {
                        throw new Error("Failed to download file from storage: ".concat(fileResponse.statusText));
                    }
                    extractedData = void 0;
                    if (!(statement.fileType === 'PDF')) return [3 /*break*/, 10];
                    // Process PDF
                    console.log("[Processing] Extracting data from PDF");
                    return [4 /*yield*/, fileResponse.arrayBuffer()];
                case 8:
                    arrayBuffer = _j.sent();
                    base64Content = Buffer.from(arrayBuffer).toString('base64');
                    return [4 /*yield*/, aiProcessor.extractDataFromPDF(base64Content, statement.fileName || 'statement.pdf')];
                case 9:
                    extractedData = _j.sent();
                    return [3 /*break*/, 13];
                case 10:
                    // Process CSV
                    console.log("[Processing] Processing CSV data");
                    return [4 /*yield*/, fileResponse.text()];
                case 11:
                    csvContent = _j.sent();
                    return [4 /*yield*/, aiProcessor.processCSVData(csvContent)];
                case 12:
                    extractedData = _j.sent();
                    _j.label = 13;
                case 13:
                    if (!extractedData || !extractedData.transactions) {
                        throw new Error('No transactions extracted from file');
                    }
                    console.log("[Processing] Extracted ".concat(extractedData.transactions.length, " transactions"));
                    // Update with extracted data
                    return [4 /*yield*/, db_1.prisma.bankStatement.update({
                            where: { id: statementId },
                            data: {
                                processingStage: 'CATEGORIZING_TRANSACTIONS',
                                extractedData: extractedData,
                                bankName: (_b = extractedData.bankInfo) === null || _b === void 0 ? void 0 : _b.bankName,
                                accountType: (_c = extractedData.bankInfo) === null || _c === void 0 ? void 0 : _c.accountType,
                                accountNumber: (_d = extractedData.bankInfo) === null || _d === void 0 ? void 0 : _d.accountNumber,
                                statementPeriod: (_e = extractedData.bankInfo) === null || _e === void 0 ? void 0 : _e.statementPeriod,
                                recordCount: ((_f = extractedData.transactions) === null || _f === void 0 ? void 0 : _f.length) || 0
                            }
                        })];
                case 14:
                    // Update with extracted data
                    _j.sent();
                    // Categorize transactions
                    console.log("[Processing] Categorizing transactions");
                    return [4 /*yield*/, aiProcessor.categorizeTransactions(extractedData.transactions || [])];
                case 15:
                    categorizedTransactions = _j.sent();
                    // Update processing stage
                    return [4 /*yield*/, db_1.prisma.bankStatement.update({
                            where: { id: statementId },
                            data: {
                                processingStage: 'ANALYZING_PATTERNS'
                            }
                        })];
                case 16:
                    // Update processing stage
                    _j.sent();
                    // Generate insights
                    console.log("[Processing] Generating financial insights");
                    return [4 /*yield*/, aiProcessor.generateFinancialInsights(categorizedTransactions, {
                            firstName: statement.user.firstName,
                            businessType: statement.user.businessType,
                            companyName: statement.user.companyName
                        })];
                case 17:
                    insights = _j.sent();
                    // Update processing stage
                    return [4 /*yield*/, db_1.prisma.bankStatement.update({
                            where: { id: statementId },
                            data: {
                                processingStage: 'DISTRIBUTING_DATA',
                                aiAnalysis: insights
                            }
                        })];
                case 18:
                    // Update processing stage
                    _j.sent();
                    // Create transactions in database
                    console.log("[Processing] Creating ".concat(categorizedTransactions.length, " transactions in database"));
                    createdTransactions = [];
                    _i = 0, categorizedTransactions_1 = categorizedTransactions;
                    _j.label = 19;
                case 19:
                    if (!(_i < categorizedTransactions_1.length)) return [3 /*break*/, 25];
                    catTxn = categorizedTransactions_1[_i];
                    originalTxn = catTxn.originalTransaction;
                    type = 'EXPENSE';
                    amount = Math.abs(originalTxn.amount || 0);
                    // Check AI's type field first
                    if (originalTxn.type) {
                        txnType = originalTxn.type.toLowerCase();
                        if (txnType === 'credit' || txnType === 'deposit') {
                            type = 'INCOME';
                        }
                        else if (txnType === 'debit' || txnType === 'withdrawal') {
                            type = 'EXPENSE';
                        }
                    }
                    categoryLower = ((_g = catTxn.suggestedCategory) === null || _g === void 0 ? void 0 : _g.toLowerCase()) || '';
                    if (categoryLower.includes('income') || categoryLower.includes('salary') ||
                        categoryLower.includes('freelance') || categoryLower.includes('dividend')) {
                        type = 'INCOME';
                    }
                    else if (categoryLower.includes('transfer')) {
                        type = 'TRANSFER';
                    }
                    descLower = ((_h = originalTxn.description) === null || _h === void 0 ? void 0 : _h.toLowerCase()) || '';
                    if (descLower.includes('transfer')) {
                        type = 'TRANSFER';
                    }
                    return [4 /*yield*/, db_1.prisma.category.findFirst({
                            where: {
                                userId: statement.userId,
                                name: catTxn.suggestedCategory
                            }
                        })];
                case 20:
                    category = _j.sent();
                    if (!!category) return [3 /*break*/, 22];
                    return [4 /*yield*/, db_1.prisma.category.create({
                            data: {
                                userId: statement.userId,
                                name: catTxn.suggestedCategory,
                                type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                                color: getCategoryColor(catTxn.suggestedCategory),
                                icon: getCategoryIcon(catTxn.suggestedCategory)
                            }
                        })];
                case 21:
                    category = _j.sent();
                    _j.label = 22;
                case 22: return [4 /*yield*/, db_1.prisma.transaction.create({
                        data: {
                            userId: statement.userId,
                            businessProfileId: statement.businessProfileId,
                            bankStatementId: statementId,
                            date: new Date(originalTxn.date),
                            amount: amount,
                            description: originalTxn.description || 'Unknown transaction',
                            merchant: catTxn.merchant,
                            category: category.name,
                            categoryId: category.id,
                            type: type,
                            aiCategorized: true,
                            confidence: catTxn.confidence,
                            isRecurring: catTxn.isRecurring || false
                        }
                    })];
                case 23:
                    transaction = _j.sent();
                    createdTransactions.push({ transaction: transaction, catTxn: catTxn });
                    _j.label = 24;
                case 24:
                    _i++;
                    return [3 /*break*/, 19];
                case 25:
                    console.log("[Processing] Created ".concat(createdTransactions.length, " transactions"));
                    // Create recurring charges for recurring transactions
                    return [4 /*yield*/, createRecurringCharges(statement.userId, statement.businessProfileId, createdTransactions)];
                case 26:
                    // Create recurring charges for recurring transactions
                    _j.sent();
                    // Update processed count and transaction count
                    return [4 /*yield*/, db_1.prisma.bankStatement.update({
                            where: { id: statementId },
                            data: {
                                processedCount: categorizedTransactions.length,
                                transactionCount: categorizedTransactions.length,
                                processingStage: 'COMPLETED',
                                status: 'COMPLETED',
                                processedAt: new Date()
                            }
                        })];
                case 27:
                    // Update processed count and transaction count
                    _j.sent();
                    console.log("[Processing] Successfully completed processing for ".concat(statement.fileName, " - ").concat(categorizedTransactions.length, " transactions"));
                    // Update budgets with actual spending
                    return [4 /*yield*/, updateBudgetsFromTransactions(statement.userId, statement.businessProfileId)];
                case 28:
                    // Update budgets with actual spending
                    _j.sent();
                    // Update user's financial metrics
                    return [4 /*yield*/, updateFinancialMetrics(statement.userId)];
                case 29:
                    // Update user's financial metrics
                    _j.sent();
                    // Create success notification
                    return [4 /*yield*/, db_1.prisma.notification.create({
                            data: {
                                userId: statement.userId,
                                type: 'CSV_PROCESSED',
                                title: 'Bank Statement Processed',
                                message: "Successfully processed ".concat(categorizedTransactions.length, " transactions from ").concat(statement.fileName),
                                isActive: true
                            }
                        })];
                case 30:
                    // Create success notification
                    _j.sent();
                    return [3 /*break*/, 33];
                case 31:
                    error_2 = _j.sent();
                    console.error('[Processing] Statement processing error:', error_2);
                    return [4 /*yield*/, db_1.prisma.bankStatement.update({
                            where: { id: statementId },
                            data: {
                                status: 'FAILED',
                                processingStage: 'FAILED',
                                errorLog: error_2 instanceof Error ? error_2.message : 'Unknown error'
                            }
                        })];
                case 32:
                    _j.sent();
                    throw error_2;
                case 33: return [2 /*return*/];
            }
        });
    });
}
exports.processStatement = processStatement;
function updateBudgetsFromTransactions(userId, businessProfileId) {
    return __awaiter(this, void 0, void 0, function () {
        var whereClause, allTransactions, transactionsByMonth, _i, allTransactions_1, txn, month, year, key, _a, _b, _c, monthYear, monthlyTransactions, _d, month, year, categorySpending, _e, monthlyTransactions_1, txn, category, type, current, _f, _g, _h, category, data, spent, suggestedBudget, budgetWhereClause, existingBudget, error_3;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    _j.trys.push([0, 11, , 12]);
                    console.log("[Processing] Updating budgets from transactions (Business Profile: ".concat(businessProfileId || 'All', ")"));
                    whereClause = {
                        userId: userId
                    };
                    // Filter by business profile if provided
                    if (businessProfileId) {
                        whereClause.businessProfileId = businessProfileId;
                    }
                    return [4 /*yield*/, db_1.prisma.transaction.findMany({
                            where: whereClause,
                            include: {
                                categoryRelation: true
                            }
                        })];
                case 1:
                    allTransactions = _j.sent();
                    console.log("[Processing] Found ".concat(allTransactions.length, " total transactions"));
                    transactionsByMonth = new Map();
                    for (_i = 0, allTransactions_1 = allTransactions; _i < allTransactions_1.length; _i++) {
                        txn = allTransactions_1[_i];
                        month = txn.date.getMonth() + 1;
                        year = txn.date.getFullYear();
                        key = "".concat(month, "-").concat(year);
                        if (!transactionsByMonth.has(key)) {
                            transactionsByMonth.set(key, []);
                        }
                        transactionsByMonth.get(key).push(txn);
                    }
                    console.log("[Processing] Processing budgets for ".concat(transactionsByMonth.size, " different months"));
                    _a = 0, _b = transactionsByMonth.entries();
                    _j.label = 2;
                case 2:
                    if (!(_a < _b.length)) return [3 /*break*/, 10];
                    _c = _b[_a], monthYear = _c[0], monthlyTransactions = _c[1];
                    _d = monthYear.split('-').map(Number), month = _d[0], year = _d[1];
                    console.log("[Processing] Processing ".concat(monthlyTransactions.length, " transactions for ").concat(month, "/").concat(year));
                    categorySpending = new Map();
                    for (_e = 0, monthlyTransactions_1 = monthlyTransactions; _e < monthlyTransactions_1.length; _e++) {
                        txn = monthlyTransactions_1[_e];
                        category = txn.category;
                        type = txn.type;
                        if (!categorySpending.has(category)) {
                            categorySpending.set(category, { amount: 0, type: type });
                        }
                        current = categorySpending.get(category);
                        current.amount += txn.amount;
                    }
                    console.log("[Processing] Updating budgets for ".concat(categorySpending.size, " categories in ").concat(month, "/").concat(year));
                    _f = 0, _g = categorySpending.entries();
                    _j.label = 3;
                case 3:
                    if (!(_f < _g.length)) return [3 /*break*/, 9];
                    _h = _g[_f], category = _h[0], data = _h[1];
                    spent = data.amount;
                    suggestedBudget = Math.max(spent * 1.2, 100);
                    budgetWhereClause = {
                        userId: userId,
                        category: category,
                        month: month,
                        year: year
                    };
                    if (businessProfileId) {
                        budgetWhereClause.businessProfileId = businessProfileId;
                    }
                    return [4 /*yield*/, db_1.prisma.budget.findFirst({
                            where: budgetWhereClause
                        })];
                case 4:
                    existingBudget = _j.sent();
                    if (!existingBudget) return [3 /*break*/, 6];
                    // Update existing budget with actual spending
                    return [4 /*yield*/, db_1.prisma.budget.update({
                            where: { id: existingBudget.id },
                            data: {
                                spent: spent
                            }
                        })];
                case 5:
                    // Update existing budget with actual spending
                    _j.sent();
                    console.log("[Processing] Updated budget for ".concat(category, " (").concat(month, "/").concat(year, "): $").concat(spent.toFixed(2), " spent"));
                    return [3 /*break*/, 8];
                case 6: 
                // Create new budget with suggested amount and actual spending
                return [4 /*yield*/, db_1.prisma.budget.create({
                        data: {
                            userId: userId,
                            businessProfileId: businessProfileId,
                            category: category,
                            month: month,
                            year: year,
                            amount: suggestedBudget,
                            spent: spent,
                            type: 'MONTHLY',
                            name: "".concat(category, " - ").concat(month, "/").concat(year)
                        }
                    })];
                case 7:
                    // Create new budget with suggested amount and actual spending
                    _j.sent();
                    console.log("[Processing] Created budget for ".concat(category, " (").concat(month, "/").concat(year, "): $").concat(suggestedBudget.toFixed(2), " budget, $").concat(spent.toFixed(2), " spent"));
                    _j.label = 8;
                case 8:
                    _f++;
                    return [3 /*break*/, 3];
                case 9:
                    _a++;
                    return [3 /*break*/, 2];
                case 10:
                    console.log('[Processing] Budget update completed for all months');
                    return [3 /*break*/, 12];
                case 11:
                    error_3 = _j.sent();
                    console.error('[Processing] Error updating budgets:', error_3);
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    });
}
function createRecurringCharges(userId, businessProfileId, transactionsData) {
    return __awaiter(this, void 0, void 0, function () {
        var recurringExpenses, _i, recurringExpenses_1, _a, transaction, catTxn, existingCharge, frequency, desc, nextDue, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    console.log("[Processing] Detecting recurring charges from ".concat(transactionsData.length, " transactions"));
                    recurringExpenses = transactionsData.filter(function (_a) {
                        var transaction = _a.transaction, catTxn = _a.catTxn;
                        return catTxn.isRecurring &&
                            transaction.type === 'EXPENSE';
                    });
                    console.log("[Processing] Found ".concat(recurringExpenses.length, " recurring expense transactions"));
                    _i = 0, recurringExpenses_1 = recurringExpenses;
                    _b.label = 1;
                case 1:
                    if (!(_i < recurringExpenses_1.length)) return [3 /*break*/, 5];
                    _a = recurringExpenses_1[_i], transaction = _a.transaction, catTxn = _a.catTxn;
                    return [4 /*yield*/, db_1.prisma.recurringCharge.findFirst({
                            where: {
                                userId: userId,
                                name: {
                                    contains: catTxn.merchant || transaction.description.substring(0, 30),
                                    mode: 'insensitive'
                                }
                            }
                        })];
                case 2:
                    existingCharge = _b.sent();
                    if (!!existingCharge) return [3 /*break*/, 4];
                    frequency = 'MONTHLY';
                    desc = transaction.description.toLowerCase();
                    if (desc.includes('monthly') || desc.includes('subscription')) {
                        frequency = 'MONTHLY';
                    }
                    else if (desc.includes('weekly')) {
                        frequency = 'WEEKLY';
                    }
                    else if (desc.includes('quarterly')) {
                        frequency = 'QUARTERLY';
                    }
                    else if (desc.includes('annual') || desc.includes('yearly')) {
                        frequency = 'ANNUALLY';
                    }
                    nextDue = new Date(transaction.date);
                    // Set next due date based on frequency
                    if (frequency === 'WEEKLY') {
                        nextDue.setDate(nextDue.getDate() + 7);
                    }
                    else if (frequency === 'MONTHLY') {
                        nextDue.setMonth(nextDue.getMonth() + 1);
                    }
                    else if (frequency === 'QUARTERLY') {
                        nextDue.setMonth(nextDue.getMonth() + 3);
                    }
                    else if (frequency === 'ANNUALLY') {
                        nextDue.setFullYear(nextDue.getFullYear() + 1);
                    }
                    return [4 /*yield*/, db_1.prisma.recurringCharge.create({
                            data: {
                                userId: userId,
                                businessProfileId: businessProfileId,
                                name: catTxn.merchant || transaction.description,
                                amount: transaction.amount,
                                frequency: frequency,
                                category: transaction.category,
                                nextDueDate: nextDue,
                                annualAmount: frequency === 'ANNUALLY' ? transaction.amount :
                                    frequency === 'MONTHLY' ? transaction.amount * 12 :
                                        frequency === 'QUARTERLY' ? transaction.amount * 4 :
                                            transaction.amount * 52,
                                isActive: true
                            }
                        })];
                case 3:
                    _b.sent();
                    console.log("[Processing] Created recurring charge: ".concat(catTxn.merchant || transaction.description, " - $").concat(transaction.amount, " ").concat(frequency));
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5:
                    console.log('[Processing] Recurring charges creation completed');
                    return [3 /*break*/, 7];
                case 6:
                    error_4 = _b.sent();
                    console.error('[Processing] Error creating recurring charges:', error_4);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function updateFinancialMetrics(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var thirtyDaysAgo, recentTransactions, income, expenses, monthlyIncome, monthlyExpenses, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return [4 /*yield*/, db_1.prisma.transaction.findMany({
                            where: {
                                userId: userId,
                                date: { gte: thirtyDaysAgo }
                            }
                        })];
                case 1:
                    recentTransactions = _a.sent();
                    income = recentTransactions
                        .filter(function (t) { return t.type === 'INCOME'; })
                        .reduce(function (sum, t) { return sum + t.amount; }, 0);
                    expenses = recentTransactions
                        .filter(function (t) { return t.type === 'EXPENSE'; })
                        .reduce(function (sum, t) { return sum + t.amount; }, 0);
                    monthlyIncome = income / 30 * 30;
                    monthlyExpenses = expenses / 30 * 30;
                    //@ts-ignore
                    return [4 /*yield*/, db_1.prisma.financialMetrics.upsert({
                            //@ts-ignore
                            where: { userId: userId },
                            create: {
                                userId: userId,
                                monthlyIncome: monthlyIncome,
                                monthlyExpenses: monthlyExpenses,
                                monthlyBurnRate: monthlyExpenses - monthlyIncome,
                                lastCalculated: new Date()
                            },
                            update: {
                                monthlyIncome: monthlyIncome,
                                monthlyExpenses: monthlyExpenses,
                                monthlyBurnRate: monthlyExpenses - monthlyIncome,
                                lastCalculated: new Date()
                            }
                        })];
                case 2:
                    //@ts-ignore
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_5 = _a.sent();
                    console.error('[Processing] Error updating financial metrics:', error_5);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getCategoryColor(category) {
    var colorMap = {
        'Food & Dining': '#FF6B6B',
        'Transportation': '#4ECDC4',
        'Shopping': '#45B7D1',
        'Entertainment': '#96CEB4',
        'Bills & Utilities': '#FFEAA7',
        'Healthcare': '#DDA0DD',
        'Education': '#98D8C8',
        'Travel': '#F7DC6F',
        'Income': '#2ECC71',
        'Salary': '#27AE60',
        'Fees & Charges': '#E74C3C',
        'Groceries': '#F39C12'
    };
    return colorMap[category] || '#3B82F6';
}
function getCategoryIcon(category) {
    var iconMap = {
        'Food & Dining': 'utensils',
        'Transportation': 'car',
        'Shopping': 'shopping-bag',
        'Entertainment': 'film',
        'Bills & Utilities': 'zap',
        'Healthcare': 'heart',
        'Education': 'book',
        'Travel': 'plane',
        'Income': 'trending-up',
        'Salary': 'dollar-sign',
        'Fees & Charges': 'alert-circle',
        'Groceries': 'shopping-cart'
    };
    return iconMap[category] || 'folder';
}
