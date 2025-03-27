Page({
  data: {
    // 导航栏 - 只保留组合贷款
    loanTypes: ['组合贷款'],
    currentType: 0, // 默认选中组合贷款

    // 计算方式 - 只保留按房屋总价
    calcTypes: ['按房屋总价'],
    currentCalcType: 0, // 默认按房屋总价

    // 基础数据
    totalPrice: 0, // 房屋总价(万元)
    loanRatio: 6.5, // 贷款比例，默认6.5成
    totalLoan: 0, // 贷款总额(万元)
    
    // 公积金贷款数据
    gjjAmount: 0, // 公积金贷款额度(万元)
    gjjYears: 30, // 公积金贷款年限
    gjjRate: 2.85, // 公积金利率
    
    // 商业贷款数据
    sydAmount: 0, // 商业贷款额度(万元)
    sydYears: 30, // 商业贷款年限
    sydRate: 3.6, // 商业贷款利率
    
    // 首付相关费用比例
    personalTaxRate: 0, // 个税比例，默认0%
    deedTaxRate: 0, // 契税比例，默认0%
    commissionRate: 0, // 佣金比例，默认0%
    otherFees: 0, // 其他费用(元)
    
    // 计算结果
    personalTax: 0, // 个税金额(万元)
    deedTax: 0, // 契税金额(万元)
    commission: 0, // 佣金(万元)
    totalDownPayment: 0, // 首付款总额(万元)
    monthlyPayment: 0, // 月供
    
    showResult: false,
  },

  // 输入房屋总价
  onTotalPriceInput(e) {
    const totalPrice = parseFloat(e.detail.value) || 0;
    const totalLoan = Math.floor(totalPrice * (this.data.loanRatio / 10)) || 0;
    this.setData({ totalPrice, totalLoan });
    this.calculateLoanAmount();
  },

  // 输入贷款比例
  onLoanRatioInput(e) {
    let loanRatio = parseFloat(e.detail.value);
    if (e.detail.value === '') {
      this.setData({ loanRatio: '' });
      return;
    }
    if (isNaN(loanRatio) || loanRatio <= 0 || loanRatio > 10) {
      wx.showToast({
        title: '请输入1-10之间的数字',
        icon: 'none'
      });
      return;
    }
    const totalLoan = Math.floor(this.data.totalPrice * (loanRatio / 10)) || 0;
    this.setData({ loanRatio, totalLoan });
    this.calculateLoanAmount();
  },

  // 输入贷款总额
  onTotalLoanInput(e) {
    const totalLoan = parseInt(e.detail.value) || 0;
    if (totalLoan > this.data.totalPrice) {
      wx.showToast({
        title: '贷款总额不能超过房屋总价',
        icon: 'none'
      });
      return;
    }
    const gjjAmount = Math.floor(this.data.gjjAmount / (this.data.totalLoan || 1) * totalLoan);
    const sydAmount = Math.floor(this.data.sydAmount / (this.data.totalLoan || 1) * totalLoan);
    this.setData({ totalLoan, gjjAmount, sydAmount });
    this.calculateAll();
  },

  // 计算贷款金额
  calculateLoanAmount() {
    const { totalLoan } = this.data;
    
    if (!totalLoan || isNaN(totalLoan)) {
      this.setData({
        gjjAmount: '0',
        sydAmount: '0'
      });
      return;
    }
    
    // 默认公积金贷款和商业贷款各占一半，向下取整
    const gjjAmount = Math.floor(totalLoan / 2);
    const sydAmount = totalLoan - gjjAmount; // 商贷金额为总额减去公积金金额
    
    this.setData({
      gjjAmount,
      sydAmount
    });
    
    this.calculateAll();
  },

  // 输入费率
  onRateInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = parseFloat(e.detail.value) / 100;
    const data = {};
    data[field] = value;
    this.setData(data);
    this.calculateAll();
  },

  // 输入其他费用
  onOtherFeesInput(e) {
    const otherFees = parseFloat(e.detail.value);
    this.setData({ otherFees });
    this.calculateAll();
  },

  // 计算所有费用
  calculateAll() {
    const { totalPrice, totalLoan, personalTaxRate, deedTaxRate, commissionRate, otherFees, gjjAmount, sydAmount, gjjRate, sydRate, gjjYears } = this.data;
    
    // 如果没有输入房屋总价或输入非法，不进行计算
    if (!totalPrice || isNaN(totalPrice)) {
      this.setData({
        downPaymentBase: '0.00',
        personalTax: '0.00',
        deedTax: '0.00',
        commission: '0.00',
        totalDownPayment: '0.00',
        monthlyPayment: '0.00',
        showResult: true
      });
      return;
    }
    
    // 计算基础首付 = 房屋总价 - 贷款总额
    const downPaymentBase = (totalPrice - totalLoan).toFixed(2);
    
    // 计算各项费用（单位：万元）
    const personalTax = (totalPrice * personalTaxRate).toFixed(2);
    const deedTax = (totalPrice * deedTaxRate).toFixed(2);
    const commission = (totalPrice * commissionRate).toFixed(2);
    
    // 计算首付款总额 = 基础首付 + 个税 + 契税 + 佣金 + 其他费用(元转万元)
    const otherFeesAmount = parseFloat(otherFees) || 0;
    const totalDownPayment = (
      parseFloat(downPaymentBase) + 
      parseFloat(personalTax) + 
      parseFloat(deedTax) + 
      parseFloat(commission) + 
      (otherFeesAmount / 10000)
    ).toFixed(2);
    
    // 计算月供
    let monthlyPayment = 0;
    try {
      const gjjValue = parseInt(gjjAmount) || 0;
      const sydValue = parseInt(sydAmount) || 0;
      const gjjMonthly = this.calculateMonthlyPayment(gjjValue, gjjRate/100, gjjYears);
      const sydMonthly = this.calculateMonthlyPayment(sydValue, sydRate/100, gjjYears);
      monthlyPayment = (gjjMonthly + sydMonthly).toFixed(2);
    } catch (e) {
      monthlyPayment = '0.00';
    }
    
    this.setData({
      downPaymentBase,
      personalTax,
      deedTax,
      commission,
      totalDownPayment,
      monthlyPayment,
      showResult: true
    });
  },

  // 计算月供
  calculateMonthlyPayment(principal, rate, years) {
    if (!principal || !rate || !years) return 0;
    const monthlyRate = rate / 12;
    const totalMonths = years * 12;
    const monthlyPayment = principal * 10000 * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / 
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    return isNaN(monthlyPayment) ? 0 : monthlyPayment;
  },

  // 修改年限
  onYearsInput(e) {
    const type = e.currentTarget.dataset.type;
    let years = parseInt(e.detail.value) || 1;
    if (years < 1) years = 1;
    if (years > 30) years = 30;
    
    const data = {};
    data[type === 'gjj' ? 'gjjYears' : 'sydYears'] = years;
    this.setData(data);
    this.calculateAll();
  },

  // 修改利率
  onRateChange(e) {
    const type = e.currentTarget.dataset.type;
    const rate = parseFloat(e.detail.value) || 0;
    const data = {};
    data[type === 'gjj' ? 'gjjRate' : 'sydRate'] = rate;
    this.setData(data);
    this.calculateAll();
  },

  // 修改公积金金额
  onGJJAmountInput(e) {
    const value = e.detail.value;
    // 如果输入为空，直接设置为空字符串
    if (value === '') {
      this.setData({ gjjAmount: '' });
      return;
    }

    const gjjAmount = parseInt(value) || 0;
    const { totalLoan } = this.data;

    // 验证公积金金额不超过贷款总额
    if (gjjAmount > totalLoan) {
      wx.showToast({
        title: '公积金金额不能超过贷款总额',
        icon: 'none'
      });
      return;
    }

    // 更新公积金金额和商贷金额
    this.setData({
      gjjAmount,
      sydAmount: totalLoan - gjjAmount // 商贷金额 = 总贷款额 - 公积金金额
    });
    
    this.calculateAll();
  },

  // 修改商贷金额
  onSYDAmountInput(e) {
    const value = e.detail.value;
    // 如果输入为空，直接设置为空字符串
    if (value === '') {
      this.setData({ sydAmount: '' });
      return;
    }

    const sydAmount = parseInt(value) || 0;
    const { totalLoan } = this.data;

    // 验证商贷金额不超过贷款总额
    if (sydAmount > totalLoan) {
      wx.showToast({
        title: '商贷金额不能超过贷款总额',
        icon: 'none'
      });
      return;
    }

    // 更新商贷金额和公积金金额
    this.setData({
      sydAmount,
      gjjAmount: totalLoan - sydAmount // 公积金金额 = 总贷款额 - 商贷金额
    });
    
    this.calculateAll();
  },

  // 开始计算按钮点击处理
  startCalculate() {
    const { totalLoan, gjjAmount, sydAmount } = this.data;
    
    // 验证贷款总额
    if (!totalLoan || totalLoan <= 0) {
      wx.showToast({
        title: '贷款总额应大于0万元',
        icon: 'none'
      });
      return;
    }
    
    // 验证公积金和商贷金额之和是否等于贷款总额
    const gjjValue = parseInt(gjjAmount) || 0;
    const sydValue = parseInt(sydAmount) || 0;
    
    if (gjjValue + sydValue !== totalLoan) {
      wx.showToast({
        title: '公积金金额和商贷金额总和要等于贷款总额',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    this.calculateAll();
    const result = {
      downPaymentBase: this.data.downPaymentBase,
      personalTax: this.data.personalTax,
      deedTax: this.data.deedTax,
      commission: this.data.commission,
      otherFees: this.data.otherFees,
      totalDownPayment: this.data.totalDownPayment,
      monthlyPayment: this.data.monthlyPayment,
      totalLoan: this.data.totalLoan,
      sydAmount: this.data.sydAmount,
      gjjAmount: this.data.gjjAmount,
      totalInterest: ((this.data.monthlyPayment * 12 * Math.max(this.data.sydYears, this.data.gjjYears)) / 10000 - this.data.totalLoan).toFixed(2),
      loanYears: Math.max(this.data.sydYears, this.data.gjjYears) // 取两种贷款年限的最大值
    };
    
    wx.navigateTo({
      url: `/pages/result/result?result=${JSON.stringify(result)}`
    });
  }
}) 