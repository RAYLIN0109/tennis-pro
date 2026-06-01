Component({
  options: { multipleSlots: true },
  externalClasses: ['custom-class'],
  properties: {
    value: { type: Number, value: 0 },
    count: { type: Number, value: 5 },
    size: { type: String, value: 'md' },
    readonly: { type: Boolean, value: false }
  },
  data: {
    stars: []
  },
  observers: {
    'value, count': function (val, count) {
      const stars = []
      for (let i = 1; i <= count; i++) {
        if (i <= Math.floor(val)) {
          stars.push('full')
        } else if (i - 0.5 <= val) {
          stars.push('half')
        } else {
          stars.push('empty')
        }
      }
      this.setData({ stars })
    }
  },
  methods: {
    onTap(e) {
      if (this.data.readonly) return
      const idx = e.currentTarget.dataset.index
      this.setData({ value: idx + 1 })
      this.triggerEvent('change', { value: idx + 1 })
    }
  }
})
