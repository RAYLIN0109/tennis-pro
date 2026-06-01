Component({
  options: { multipleSlots: true },
  externalClasses: ['custom-class'],
  properties: {
    placeholder: { type: String, value: '搜索' },
    value: { type: String, value: '' }
  },
  methods: {
    onInput(e) {
      this.setData({ value: e.detail.value })
      this.triggerEvent('change', { value: e.detail.value })
    },
    onConfirm() {
      this.triggerEvent('search', { value: this.data.value })
    },
    onClear() {
      this.setData({ value: '' })
      this.triggerEvent('change', { value: '' })
      this.triggerEvent('search', { value: '' })
    }
  }
})
