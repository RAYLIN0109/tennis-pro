/**
 * 获取当前位置
 */
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize')) {
          wx.showModal({
            title: '需要位置权限',
            content: '请在设置中开启位置权限以获得更好的体验',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
          })
        }
        reject(err)
      }
    })
  })
}

/**
 * Haversine 公式计算两点距离（米）
 */
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg) {
  return deg * Math.PI / 180
}

/**
 * 格式化距离显示
 */
function formatDistance(meters) {
  if (!meters && meters !== 0) return ''
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * 打开内置地图导航
 */
function openNavigation(latitude, longitude, name) {
  wx.openLocation({
    latitude,
    longitude,
    name: name || '',
    scale: 18
  })
}

module.exports = { getCurrentLocation, getDistance, formatDistance, openNavigation }
