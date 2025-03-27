Page({
  data: {
    downPaymentBase: '0.00',  // 基础首付
    personalTax: '0.00',      // 个人所得税
    deedTax: '0.00',         // 契税
    commission: '0.00',       // 中介佣金
    otherFees: '0',          // 其他费用
    totalDownPayment: '0.00', // 首付款总额
    monthlyPayment: '0.00',   // 月供
    totalLoan: 0,
    totalInterest: 0,
    loanYears: 30,
    repaymentPlan: []
  },

  onLoad(options) {
    if (options.result) {
      try {
        const result = JSON.parse(options.result);
        // 确保数据格式正确
        this.setData({
          downPaymentBase: parseFloat(result.downPaymentBase).toFixed(2),
          personalTax: parseFloat(result.personalTax).toFixed(2),
          deedTax: parseFloat(result.deedTax).toFixed(2),
          commission: parseFloat(result.commission).toFixed(2),
          otherFees: result.otherFees,
          totalDownPayment: parseFloat(result.totalDownPayment).toFixed(2),
          monthlyPayment: parseFloat(result.monthlyPayment).toFixed(2),
          totalLoan: result.totalLoan,
          totalInterest: result.totalInterest,
          loanYears: result.loanYears,
          repaymentPlan: result.repaymentPlan || this.generateRepaymentPlan(result)
        });
      } catch (e) {
        wx.showToast({
          title: '数据解析错误',
          icon: 'none'
        });
      }
    }
  },

  // 生成还款计划
  generateRepaymentPlan(result) {
    const plan = [];
    const monthlyPayment = parseFloat(result.monthlyPayment);
    const sydAmount = parseFloat(result.sydAmount) || 0;
    const gjjAmount = parseFloat(result.gjjAmount) || 0;
    const ratio = sydAmount / (sydAmount + gjjAmount);
    const totalMonths = result.loanYears * 12; // 总还款月数

    for (let i = 1; i <= totalMonths; i++) {
      plan.push({
        period: i,
        totalAmount: monthlyPayment.toFixed(2),
        sydAmount: (monthlyPayment * ratio).toFixed(2),
        gjjAmount: (monthlyPayment * (1 - ratio)).toFixed(2)
      });
    }
    return plan;
  },

  goBack() {
    wx.navigateBack();
  }
}) 