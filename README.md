# Wistia Player Alternative

由于 SpeedyAgency 的视频数量不断增加（得益于 AI 的进步，制作视频的成本越来越低），我们的视频托管供应商 Wistia 更改了收费策略，现在存放视频也开始收费。因此，我们需要将部分视频迁移至 Amazon S3。

## 项目目标

1. 实现一个功能与 Wistia 视频播放器相似的视频播放器。
2. 将 Wistia 上的视频上传至 S3。

## 迁移计划

将视频上传至 S3 可以作为一个独立的项目来进行。计划在迁移到 S3 之后，会生成一个类似于以下链接的 JSON 文件来描述视频数据：
[示例 JSON 文件](https://s3.ap-southeast-1.amazonaws.com/s3.test.mixmedia.com/wistia-backup/7bg0z4stnx/assets.json)

## 使用 Video.js 实现视频播放器

我们将借助 [Video.js](https://videojs.com/) 项目来实现与 Wistia 外观和功能相似的视频播放器。

## 项目结构

- `src/`：项目源代码目录

## 许可

本项目基于 MIT 许可进行分发。详情请参阅 [LICENSE](LICENSE) 文件。

---

感谢您对本项目的关注和支持！
