import * as React from 'react';
import { Image, ImageURISource, Text, View, ViewStyle } from 'react-native';
import { simpleStyle } from './image-viewer.style';

interface IOnMove {
  type: string;
  positionX: number;
  positionY: number;
  scale: number;
  zoomCurrentDistance: number;
}

export class Props {
  /**
   * 是否显示
   * Display
   */
  public show?: boolean = false;

  /**
   * 图片数组,
   * Array of images
   */
  public imageUrls: IImageInfo[] = [];

  /**
   * 滑动到下一页的X阈值
   * X threshold for sliding to the next page
   */
  public flipThreshold?: number = 80;

  /**
   * 当前页能滑到下一页X位置最大值
   * The current page can slide to the maximum X position of the next page
   */
  public maxOverflow?: number = 300;

  /**
   * 初始显示第几张图
   * Initially display the first picture
   */
  public index?: number = 0;

  /**
   * 加载失败的图
   * Failed to load image
   */
  public failImageSource?: IImageInfo = undefined;

  /**
   * 背景颜色
   * Background Color
   */
  public backgroundColor?: string = 'black';

  /**
   * style props for the footer container
   */
  public footerContainerStyle?: object = {};

  /**
   * Menu Context Values
   */
  public menuContext?: any = { saveToLocal: 'save to the album', cancel: 'cancel' };

  /**
   * 是否开启长按保存到本地的功能
   * Whether to enable the long press and save function to local
   */
  public saveToLocalByLongPress?: boolean = false;//disabled till funcionality is fixed / forever

  /**
   * 是否允许缩放图片
   * Is it allowed to zoom the image?
   */
  public enableImageZoom?: boolean = true;

  public style?: ViewStyle = {};

  /**
   * Enable swipe down to close image viewer.
   * When swipe down, will trigger onCancel.
   */
  public enableSwipeDown?: boolean = false;

  /**
   * threshold for firing swipe down function
   */
  public swipeDownThreshold?: number;

  public doubleClickInterval?: number;

  /**
   * Min and Max scale for zooming
   */
  public minScale?: number;

  public maxScale?: number;

  /**
   * 是否预加载图片
   * Whether to preload images
   */
  public enablePreload?: boolean = false;

  /**
   * 翻页时的动画时间
   * Page turning animation time
   */
  public pageAnimateTime?: number = 100;

  /**
   * 是否启用原生动画驱动
   * Whether to use the native code to perform animations.
   */
  public useNativeDriver?: boolean = false;

  /**
   * 长按图片的回调
   * Callback for long pressing the image
   */
  public onLongPress?: (image?: IImageInfo) => void = () => {
    //
  };

  /**
   * 单击回调
   * Click callback
   */
  public onClick?: (close?: () => any, currentShowIndex?: number) => void = () => {
    //
  };

  /**
   * 双击回调
   * Double click callback
   */
  public onDoubleClick?: (close?: () => any) => void = () => {
    //
  };

  /**
   * 图片保存到本地方法，如果写了这个方法，就不会调取系统默认方法
   * 针对安卓不支持 saveToCameraRoll 远程图片，可以在安卓调用此回调，调用安卓原生接口
   *
   * The method for saving pictures to the local computer.
   * If this method is written, the system default method will not be called.
   * For Android that does not support saveToCameraRoll remote pictures, this callback can be called on Android to call the Android native interface.
   *
   * todo: fix onSave
   */
  public onSave?: (url: string) => void = () => {
    //
  };

  public onMove?: (position?: IOnMove) => void = () => {
    //
  };

  /**
   * 自定义头部
   * Custom Header
   */
  public renderHeader?: (currentIndex?: number) => React.ReactElement<any> = () => {
    return React.createElement(View, null);
  };

  /**
   * 自定义尾部
   * Custom footer
   */
  public renderFooter?: (currentIndex: number) => React.ReactElement<any> = () => {
    return React.createElement(View, null);
  };

  /**
   * 自定义计时器
   * Custom timer
   */
  public renderIndicator?: (currentIndex?: number, allSize?: number) => React.ReactElement<any> = (
    currentIndex?: number,
    allSize?: number
  ) => {
    return React.createElement(
      View,
      { style: simpleStyle.count },
      React.createElement(Text, { style: simpleStyle.countText }, currentIndex + '/' + allSize)
    );
  };

  /**
   * Render a custom component (most often an image)
   */
  public customRender?: (props: any) => React.ReactElement<any> = (props: any) => {
    return React.createElement(Image, props);
  };

  /**
   * 自定义左翻页按钮
   * Customize the left page button
   */
  public renderArrowLeft?: () => React.ReactElement<any> = () => {
    return React.createElement(View, null);
  };

  /**
   * 自定义右翻页按钮
   * Customize the right page button
   */
  public renderArrowRight?: () => React.ReactElement<any> = () => {
    return React.createElement(View, null);
  };

  /**
   * 弹出大图的回调
   * Pop-up callback
   */
  public onShowModal?: (content?: any) => void = () => {
    //
  };

  /**
   * 取消看图的回调
   * Cancel the callback of viewing the picture
   */
  public onCancel?: () => void = () => {
    //
  };

  /**
   * function that fires when user swipes down
   */
  public onSwipeDown?: () => void = () => {
    //
  };

  /**
   * 渲染loading元素
   * Rendering loading elements
   */
  public loadingRender?: () => React.ReactElement<any> = () => {
    return null as any;
  };

  /**
   * 保存到相册的回调
   * Callback for saving to the album
   */
  public onSaveToCamera?: (index?: number) => void = () => {
    //
  };

  /**
   * 当图片切换时触发
   * Triggered when the image switches
   */
  public onChange?: (index?: number) => void = () => {
    //
  };

  public menus?: ({ cancel, saveToLocal }: any) => React.ReactElement<any>;
}

export class State {
  /**
   * 是否显示
   * Display
   */
  public show?: boolean = false;

  /**
   * 当前显示第几个
   * Currently showing the number
   */
  public currentShowIndex?: number = 0;

  /**
   * Used to detect if parent component applied new index prop
   */
  public prevIndexProp?: number = 0;

  /**
   * 图片拉取是否完毕了
   * Is the image pull completed?
   */
  public imageLoaded?: boolean = false;

  /**
   * 图片长宽列表
   * Image length and width list
   */
  public imageSizes?: IImageSize[] = [];

  /**
   * 是否出现功能菜单
   * Whether the function menu appears
   */
  public isShowMenu?: boolean = false;
}

export interface IImageInfo {
  url: string;
  /**
   * 没有的话会自动拉取
   * If not, it will be automatically pulled.
   */
  width?: number;
  /**
   * 没有的话会自动拉取
   * If not, it will be automatically pulled.
   */
  height?: number;
  /**
   * 图片字节大小(kb为单位)
   * Image byte size (in kb)
   */
  sizeKb?: number;
  /**
   * 原图字节大小(kb为单位)
   * 如果设置了这个字段,并且有原图url,则显示查看原图按钮
   * Original image byte size (in kb)
   * If this field is set and there is an original image URL, a View Original Image button will be displayed
   */
  originSizeKb?: number;
  /**
   * 原图url地址
   * Original image URL
   */
  originUrl?: string;
  /**
   * Pass to image props
   */
  props?: any;
  /**
   * 初始是否不超高 TODO:
   * Is the initial height not too high?
   */
  freeHeight?: boolean;
  /**
   * 初始是否不超高 TODO:
   * Is the initial width not too high?
   */
  freeWidth?: boolean;
}

export interface IImageSize {
  width: number;
  height: number;
  // 图片加载状态 // Image loading status
  status: 'loading' | 'success' | 'fail';
}
