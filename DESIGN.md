---
version: alpha
name: Smart Bookmark
description: 浅色高密度书签管理界面
colors:
  surface: "#FFFFFF"
  sidebar: "#F8F9FA"
  detail: "#FAFAFB"
  text: "#202124"
  secondary: "#5F6368"
  primary: "#1A73E8"
  action-hover: "#1557B0"
  selection: "#E8F0FE"
  selection-text: "#1967D2"
  success: "#137333"
  success-background: "#E6F4EA"
  error: "#C5221F"
  error-background: "#FCE8E6"
  warning-background: "#FEF7E0"
typography:
  body:
    fontFamily: "Plus Jakarta Sans, Microsoft YaHei UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  metadata:
    fontFamily: "JetBrains Mono, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
rounded:
  control: "6px"
  dialog: "12px"
spacing:
  small: "6px"
  gap: "12px"
  panel: "16px"
components:
  toolbar:
    backgroundColor: "{colors.surface}"
    height: "54px"
    textColor: "{colors.text}"
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.text}"
    width: "244px"
  detail-panel:
    backgroundColor: "{colors.detail}"
    textColor: "{colors.text}"
    width: "340px"
  action-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "36px"
  action-button-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "{colors.surface}"
  selected-row:
    backgroundColor: "{colors.selection}"
    textColor: "{colors.selection-text}"
  success-notice:
    backgroundColor: "{colors.success-background}"
    textColor: "{colors.success}"
  error-notice:
    backgroundColor: "{colors.error-background}"
    textColor: "{colors.error}"
  warning-notice:
    backgroundColor: "{colors.warning-background}"
    textColor: "#9A5200"
---

# Smart Bookmark

## Overview

以 Chrome 书签管理器为参考。顶部集中搜索和常用操作，左侧按目录和标签导航，中间扫描列表，右侧编辑选中书签。来源为 `design-reference/web/smart-bookmark` 中的界面源码与样式。

## Colors

主列表为白色，侧栏为浅灰，#DADCE0 细边框分隔区域。浅蓝用于选中行，蓝色用于主要操作和焦点。用短文字搭配绿色成功、红色错误和浅黄警示。正式界面加深了警示文字以提高对比度。

## Typography

列表、表单和说明采用紧凑的无衬线字体，网址和数字可用等宽字体。Windows 优先使用本机可用的字体，中文回退至 Microsoft YaHei UI。

## Layout

工具栏高 54px，列表标题行高 32px，详情面板宽 340px，在 1280px 起增加到 360px。宽窗口显示目录、列表和详情。768px 以下目录和详情使用覆盖层，网址和文件夹列按可用空间逐级隐藏。长文本截断，详情保留完整内容。

## Elevation & Depth

常驻分栏以细边框区分。对话框和滑出面板用阴影突出当前操作，背景遮罩表示对话框打开状态。

## Shapes

控件采用 6px 圆角，搜索输入与小标签采用胶囊形态，主要对话框采用 12px 圆角。

## Components

工具栏、目录树、列表、详情表单和 Agent 面板映射到桌面窗口。Chrome 扩展以独立弹窗呈现连接和配对状态。导入、写回和 Agent 请求在操作附近显示进行中、成功、失败或可重试状态。

## Do's and Don'ts

- 使用高密度行、清晰列对齐、键盘焦点与带文字的状态反馈。
- 用真实连接和本地数据驱动正式界面。状态切换控件与预置样例用于参考原型。
