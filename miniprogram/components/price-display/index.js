Component({
  options: { multipleSlots: true },
  externalClasses: ['custom-class'],
  properties: {
    amount: { type: Number, value: 0 },
    size: { type: String, value: 'md' },
    prefix: { type: String, value: '¥' },
    suffix: { type: String, value: '' }
  },
  data: {
    displayPrice: '0.00'
  },
  observers: {
    'amount': function (cents) {
      const yuan = (cents || 0) / 100
      this.setData({
        displayPrice: Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2)
      })
    }
  }
})
