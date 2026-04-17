# PIXEL MUSEUM

一个黑白灰像素作品展示站，支持：

- 按月份目录自动扫描作品
- 作品分类筛选
- 弹窗详情展示
- 通过 `works.manifest.json` 做可选 metadata 覆写

## 本地预览

先生成作品数据：

```bash
npm run generate:works
```

再启动一个静态服务器：

```bash
python3 -m http.server 8000
```

浏览器打开：

```text
http://localhost:8000
```

## 作品维护

作品图片放在：

```text
assets/works/YYYYMM/
```

例如：

```text
assets/works/202603/仙人掌.svg
assets/works/202604/房子.svg
```

### 默认规则

- 月份目录使用 `YYYYMM`
- 脚本会自动扫描子目录中的图片
- 默认标题使用文件名
- 默认分类为 `其他`
- 默认简介为空
- 默认日期使用该月 `01` 号

### 可选覆写

如果某个作品需要补充更精确的信息，在 `works.manifest.json` 里加一条：

```json
{
  "202604-house": {
    "file": "202604/房子.svg",
    "day": 16,
    "category": "建筑",
    "summary": "以简化体块表现的像素房屋。"
  }
}
```

字段说明：

- `file`: 作品图片相对路径，必填
- `day`: 该作品在当月的日期，可选
- `title`: 自定义标题，可选
- `category`: 自定义分类，可选
- `summary`: 自定义简介，可选

## 更新流程

新增或修改作品后，运行：

```bash
npm run generate:works
```

这会重新生成：

```text
works.json
```

前端页面直接读取这份数据。

## GitHub Pages

仓库已包含 GitHub Pages 工作流。推送到 `main` 后，GitHub Actions 会自动部署静态站。

如果是首次开启：

1. 打开仓库 `Settings`
2. 进入 `Pages`
3. 在 `Build and deployment` 中选择 `GitHub Actions`
