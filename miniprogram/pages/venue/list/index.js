const VenueService = require('../../services/venue')
const { COURT_TYPES } = require('../../common/constants/venue')
var mock = require('../../common/mock-data')

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    hasMore: true,
    searchValue: '',
    courtTypes: COURT_TYPES,
    selectedCourtType: ''
  },

  onLoad() {
    this.loadData(true)
  },

  onPullDownRefresh() {
    this.loadData(true).then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadData(false)
    }
  },

  loadData(reset) {
    if (this.data.loading) return Promise.resolve()
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    if (reset) {
      this.setData({ list: [], hasMore: true })
    }

    const serviceCall = this.data.searchValue
      ? VenueService.search(this.data.searchValue, page)
      : VenueService.getList({ page, pageSize: this.data.pageSize, courtType: this.data.selectedCourtType })

    return serviceCall
      .then((res) => {
        const newList = reset ? res.list : [...this.data.list, ...res.list]
        this.setData({
          list: newList,
          total: res.total,
          page: page + 1,
          hasMore: newList.length < res.total
        })
      })
      .catch(() => {
        if (reset) {
          var list = mock.mockVenues
          if (this.data.selectedCourtType) {
            // 修复 A2: court_types 数组存的是中文标签，selectedCourtType 是英文 value，
            // 需要先将 value 转换为 label 才能匹配
            var cnLabel = COURT_TYPES.find(function(t) { return t.value === this.data.selectedCourtType }.bind(this)).label
            list = list.filter(function(v) { return v.court_types.indexOf(cnLabel) > -1 })
          }
          this.setData({ list: list, total: list.length, hasMore: false })
        }
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  onSearch(e) {
    this.setData({ searchValue: e.detail.value || '' })
    this.loadData(true)
  },

  onSearchChange(e) {
    this.setData({ searchValue: e.detail.value })
  },

  onFilterCourtType(e) {
    const val = e.currentTarget.dataset.value
    this.setData({
      selectedCourtType: this.data.selectedCourtType === val ? '' : val
    })
    this.loadData(true)
  },

  goVenueDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/venue/detail/index?id=${id}` })
  }
})
