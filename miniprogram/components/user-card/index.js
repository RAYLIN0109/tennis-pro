Component({
  options: { multipleSlots: true },
  externalClasses: ['custom-class'],
  properties: {
    user: { type: Object, value: {} },
    showLevel: { type: Boolean, value: true },
    size: { type: String, value: 'md' }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { user: this.data.user })
    }
  }
})
