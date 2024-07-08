const BaseURL = 'https://s3.ap-southeast-1.amazonaws.com/s3.test.mixmedia.com/wistia-backup/';

export default {
  fetchAssets(hashId) {
      return fetch(`${BaseURL}${hashId}/assets.json`, {
          method: 'GET',
          mode: 'cors', // 允许跨域请求
          headers: {
              'Content-Type': 'application/json'
          }
      })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.json();
          })
          .then(data => {
              const list  = Array.from(data);
              const coverItem = list.find(item => item.type === 'StillImageFile');
              return {
                  cover: coverItem.url,
                  sources: list.filter(item => item.type.includes("VideoFile"))
                      .map(item => {
                          return {
                              src: item.url,
                              type: item.contentType,
                          }
                      })
              }
          })
  },
};
