Component({
  options: { multipleSlots: true },
  externalClasses: ['custom-class'],
  properties: {
    type: { type: String, value: 'list' },
    rows: { type: Number, value: 3 }
  },
  data: {
    items: []
  },
  lifetimes: {
    attached() {
      const items = []
      for (let i = 0; i < this.data.rows; i++) {
        items.push(i)
      }
      this.setData({ items })
    }
  }
})
