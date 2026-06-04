Page({
  data: {
    activityTypes: [
      { value: 'pickup_game', label: '约球', icon: '🎾' },
      { value: 'watch_party', label: '观赛', icon: '📺' },
      { value: 'training', label: '训练营', icon: '🏋️' },
      { value: 'tournament', label: '比赛', icon: '🏆' }
    ],
    availableTags: ['新手友好', '进阶提升', '周末活动', '室内场', '室外场', '单打', '双打'],
    tagItems: [
      { name: '新手友好', selected: false },
      { name: '进阶提升', selected: false },
      { name: '周末活动', selected: false },
      { name: '室内场', selected: false },
      { name: '室外场', selected: false },
      { name: '单打', selected: false },
      { name: '双打', selected: false }
    ],
    form: {
      type: 'pickup_game',
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location_name: '',
      location: null,
      min_participants: 2,
      max_participants: 10,
      fee: '',
      tags: [],
      cover_image: ''
    },
    // 日期时间选择器数据
    todayDate: '',
    maxDate: '',
    startDate: '',
    startTime: '',
    startDateText: '',
    startTimeText: '',
    endDate: '',
    endTime: '',
    endDateText: '',
    endTimeText: '',
    canSubmit: false
  },

  onLoad() {
    // 初始化日期范围
    const now = new Date()
    const today = this.formatISODate(now)
    const max = new Date(now)
    max.setDate(max.getDate() + 30)
    const maxDate = this.formatISODate(max)

    this.setData({
      todayDate: today,
      maxDate: maxDate,
      startDate: today,
      endDate: today,
      startTime: '14:00',
      endTime: '16:00',
      startDateText: this.formatDateText(now),
      startTimeText: '14:00',
      endDateText: this.formatDateText(now),
      endTimeText: '16:00'
    }, () => {
      this.updateTimeDisplay()
      this.updateCanSubmit()
    })
  },

  formatISODate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  formatDateText(date) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`
  },

  updateTimeDisplay() {
    const { startDateText, startTimeText, endDateText, endTimeText } = this.data
    const start_time = startDateText && startTimeText ? `${startDateText} ${startTimeText}` : ''
    const end_time = endDateText && endTimeText ? `${endDateText} ${endTimeText}` : ''

    this.setData({
      'form.start_time': start_time,
      'form.end_time': end_time
    }, () => {
      this.updateCanSubmit()
    })
  },

  updateCanSubmit() {
    const { form } = this.data
    const canSubmit = !!(form.title && form.start_time && form.end_time && form.location_name)
    this.setData({ canSubmit })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  selectType(e) {
    const type = e.currentTarget.dataset.value
    this.setData({ 'form.type': type })
  },

  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value }, () => {
      this.updateCanSubmit()
    })
  },

  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value })
  },

  onLocationInput(e) {
    this.setData({ 'form.location_name': e.detail.value }, () => {
      this.updateCanSubmit()
    })
  },

  onFeeInput(e) {
    this.setData({ 'form.fee': e.detail.value })
  },

  toggleFree() {
    const currentFee = this.data.form.fee
    this.setData({ 'form.fee': currentFee === '' || parseFloat(currentFee) === 0 ? '50' : '' })
  },

  // ===== 原生 picker 时间选择 =====
  onStartDateChange(e) {
    const dateStr = e.detail.value
    const date = new Date(dateStr)
    const dateText = this.formatDateText(date)
    this.setData({
      startDate: dateStr,
      startDateText: dateText,
      endDate: dateStr,
      endDateText: dateText
    }, () => {
      this.updateTimeDisplay()
    })
  },

  onStartTimeChange(e) {
    this.setData({
      startTime: e.detail.value,
      startTimeText: e.detail.value
    }, () => {
      this.updateTimeDisplay()
    })
  },

  onEndDateChange(e) {
    const dateStr = e.detail.value
    const date = new Date(dateStr)
    const dateText = this.formatDateText(date)
    this.setData({
      endDate: dateStr,
      endDateText: dateText
    }, () => {
      this.updateTimeDisplay()
    })
  },

  onEndTimeChange(e) {
    this.setData({
      endTime: e.detail.value,
      endTimeText: e.detail.value
    }, () => {
      this.updateTimeDisplay()
    })
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.location_name': res.name,
          'form.location': {
            name: res.name,
            address: res.address,
            lat: res.latitude,
            lng: res.longitude
          }
        }, () => {
          this.updateCanSubmit()
        })
      },
      fail: () => {
        wx.showToast({ title: '请手动输入地址', icon: 'none' })
      }
    })
  },

  increaseMin() {
    const { min_participants, max_participants } = this.data.form
    if (min_participants < max_participants - 1) {
      this.setData({ 'form.min_participants': min_participants + 1 })
    }
  },

  decreaseMin() {
    const { min_participants } = this.data.form
    if (min_participants > 1) {
      this.setData({ 'form.min_participants': min_participants - 1 })
    }
  },

  increaseMax() {
    const { max_participants } = this.data.form
    if (max_participants < 100) {
      this.setData({ 'form.max_participants': max_participants + 1 })
    }
  },

  decreaseMax() {
    const { min_participants, max_participants } = this.data.form
    if (max_participants > min_participants + 1) {
      this.setData({ 'form.max_participants': max_participants - 1 })
    }
  },

  toggleTag(e) {
    const tagName = e.currentTarget.dataset.tag
    const tagItems = this.data.tagItems.map(item => {
      if (item.name === tagName) {
        return { ...item, selected: !item.selected }
      }
      return item
    })

    const tags = tagItems.filter(item => item.selected).map(item => item.name)

    this.setData({
      tagItems,
      'form.tags': tags
    })
  },

  async submitForm() {
    if (!this.data.canSubmit) {
      wx.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }

    const { form } = this.data

    const activityData = {
      type: form.type,
      title: form.title,
      description: form.description,
      start_time: this.parseTime(form.start_time),
      end_time: this.parseTime(form.end_time),
      location: form.location || { name: form.location_name },
      min_participants: form.min_participants,
      max_participants: form.max_participants,
      fee: parseFloat(form.fee) || 0,
      tags: form.tags
    }

    // 校验结束时间不早于开始时间
    if (activityData.start_time && activityData.end_time &&
        new Date(activityData.end_time) <= new Date(activityData.start_time)) {
      wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' })
      return
    }

    try {
      const ActivityService = require('../../../services/activity')
      await ActivityService.create(activityData)
      wx.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      wx.showToast({ title: err.message || '发布失败', icon: 'none' })
    }
  },

  parseTime(timeStr) {
    if (!timeStr) return null
    const now = new Date()

    const parts = timeStr.split(' ')
    if (parts.length < 2) return null

    const datePart = parts[0] + ' ' + parts[1]
    const timePart = parts[2]

    const dateMatch = datePart.match(/(\d+)月(\d+)日/)
    if (!dateMatch) return null

    const month = parseInt(dateMatch[1]) - 1
    const day = parseInt(dateMatch[2])

    const timeMatch = timePart.match(/(\d+):(\d+)/)
    if (!timeMatch) return null

    const hour = parseInt(timeMatch[1])
    const minute = parseInt(timeMatch[2])

    const date = new Date(now.getFullYear(), month, day, hour, minute)
    return date.toISOString()
  }
})