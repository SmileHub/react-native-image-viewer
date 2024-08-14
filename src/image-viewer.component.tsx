import * as React from 'react';  //todo: possible optimization

import {
  Animated,
  // CameraRoll,  //todo: supports only react 17, so we remove functionality, otherwise refactor to use something like https://github.com/idrisssakhi/photoGallery
  Dimensions,
  I18nManager,
  Image,
  PanResponder,
  Platform,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle
} from 'react-native';
// import ImageZoom from 'react-native-image-pan-zoom';//deprecated
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import styles from './image-viewer.style';
import { IImageInfo, IImageSize, Props, State } from './image-viewer.type';

export default class ImageViewer extends React.Component<Props, State> {
  public static defaultProps = new Props();
  public state = new State();

  // 背景透明度渐变动画
  // EN: Background transparency gradient animation
  private fadeAnim = new Animated.Value(0);

  // 当前基准位置
  // EN: Current reference position
  private standardPositionX = 0;

  // 整体位移，用来切换图片用
  // EN: Overall displacement, used to switch images
  private positionXNumber = 0;
  private positionX = new Animated.Value(0);

  private width = 0;  //todo: possible optimization
  private height = 0; //todo: possible optimization

  private styles = styles(0, 0, 'transparent');

  // 是否执行过 layout. fix 安卓不断触发 onLayout 的 bug
  // EN: Whether layout has been executed. Fix the bug where Android constantly triggers onLayout
  private hasLayout = false;

  // 记录已加载的图片 index
  // EN: Record the index of loaded images
  private loadedIndex = new Map<number, boolean>();

  private handleLongPressWithIndex = new Map<number, any>();

  private imageRefs: any[] = [];

  public componentDidMount() {
    this.init(this.props);
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.index !== prevState.prevIndexProp) {
      return { currentShowIndex: nextProps.index, prevIndexProp: nextProps.index };
    }
    return null;
  }

  public componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.index !== this.props.index) {
      // 立刻预加载要看的图
      // EN: Immediately preload the image to be viewed
      this.loadImage(this.props.index || 0);

      this.jumpToCurrentImage();

      // 显示动画
      // EN: Display animation
      Animated.timing(this.fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: !!this.props.useNativeDriver
      }).start();
    }
  }

  /**
   * props 有变化时执行
   * EN: Execute when props change
   */
  public init(nextProps: Props) {
    if (nextProps.imageUrls.length === 0) {
      // 隐藏时候清空
      // EN: Clear when hidden
      this.fadeAnim.setValue(0);
      return this.setState(new State());
    }

    // 给 imageSizes 塞入空数组
    // EN: Insert an empty array into imageSizes
    const imageSizes: IImageSize[] = [];
    nextProps.imageUrls.forEach(imageUrl => {
      imageSizes.push({
        width: imageUrl.width || 0,
        height: imageUrl.height || 0,
        status: 'loading'
      });
    });

    this.setState(
      {
        currentShowIndex: nextProps.index,
        prevIndexProp: nextProps.index || 0,
        imageSizes
      },
      () => {
        // 立刻预加载要看的图
        // EN: Immediately preload the image to be viewed
        this.loadImage(nextProps.index || 0);

        this.jumpToCurrentImage();

        // 显示动画
        // EN: Display animation
        Animated.timing(this.fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: !!nextProps.useNativeDriver
        }).start();
      }
    );
  }

  /**
   * reset Image scale and position
   */
  public resetImageByIndex = (index: number) => {
    this.imageRefs[index] && this.imageRefs[index].reset();
  };

  /**
   * 调到当前看图位置
   * EN: Jump to the current image viewing position
   */
  public jumpToCurrentImage() {
    // 跳到当前图的位置
    // EN: Jump to the position of the current image
    this.positionXNumber = this.width * (this.state.currentShowIndex || 0) * (I18nManager.isRTL ? 1 : -1);
    this.standardPositionX = this.positionXNumber;
    this.positionX.setValue(this.positionXNumber);
  }

  /**
   * 加载图片，主要是获取图片长与宽
   * EN: Load image, mainly to get the width and height of the image
   */
  public loadImage(index: number) {
    if (!this!.state!.imageSizes![index]) {
      return;
    }

    if (this.loadedIndex.has(index)) {
      return;
    }
    this.loadedIndex.set(index, true);

    const image = this.props.imageUrls[index];
    const imageStatus = { ...this!.state!.imageSizes![index] };

    // 保存 imageSize
    // EN: Save imageSize
    const saveImageSize = () => {
      // 如果已经 success 了，就不做处理
      // EN: If it is already successful, do not process
      if (this!.state!.imageSizes![index] && this!.state!.imageSizes![index].status !== 'loading') {
        return;
      }

      const imageSizes = this!.state!.imageSizes!.slice();
      imageSizes[index] = imageStatus;
      this.setState({ imageSizes });
    };

    if (this!.state!.imageSizes![index].status === 'success') {
      // 已经加载过就不会加载了
      // EN: It will not load again if it has already been loaded
      return;
    }

    // 如果已经有宽高了，直接设置为 success
    // EN: If the width and height are already known, set to success directly
    if (this!.state!.imageSizes![index].width > 0 && this!.state!.imageSizes![index].height > 0) {
      imageStatus.status = 'success';
      saveImageSize();
      return;
    }

    // 是否加载完毕了图片大小
    // EN: Whether the image size has been loaded
    const sizeLoaded = false; //todo: possible optimization
    // 是否加载完毕了图片
    // EN: Whether the image has been loaded
    let imageLoaded = false;

    // Tagged success if url is started with file:, or not set yet(for custom source.uri).
    if (!image.url || image.url.startsWith(`file:`)) {
      imageLoaded = true;
    }

    // 如果已知源图片宽高，直接设置为 success
    // EN: If the width and height of the source image are known, set to success directly
    if (image.width && image.height) {
      if (this.props.enablePreload && imageLoaded === false) {
        Image.prefetch(image.url);
      }
      imageStatus.width = image.width;
      imageStatus.height = image.height;
      imageStatus.status = 'success';
      saveImageSize();
      return;
    }

    Image.getSize(
      image.url,
      (width: number, height: number) => {
        imageStatus.width = width;
        imageStatus.height = height;
        imageStatus.status = 'success';
        saveImageSize();
      },
      () => {
        try {
          const data = (Image as any).resolveAssetSource(image.props.source); //todo: double check for errors
          imageStatus.width = data.width;
          imageStatus.height = data.height;
          imageStatus.status = 'success';
          saveImageSize();
        } catch (newError) {
          // Give up..
          // EN: Give up..
          imageStatus.status = 'fail';
          saveImageSize();
        }
      }
    );
  }

  /**
   * 预加载图片
   * EN: Preload image
   */
  public preloadImage = (index: number) => {
    if (index < this.state.imageSizes!.length) {
      this.loadImage(index + 1);
    }
  };
  /**
   * 触发溢出水平滚动
   * EN: Trigger overflow horizontal scrolling
   */
  public handleHorizontalOuterRangeOffset = (offsetX: number = 0) => {
    this.positionXNumber = this.standardPositionX + offsetX;
    this.positionX.setValue(this.positionXNumber);

    const offsetXRTL = !I18nManager.isRTL ? offsetX : -offsetX;

    if (offsetXRTL < 0) {
      if (this!.state!.currentShowIndex || 0 < this.props.imageUrls.length - 1) {
        this.loadImage((this!.state!.currentShowIndex || 0) + 1);
      }
    } else if (offsetXRTL > 0) {
      if (this!.state!.currentShowIndex || 0 > 0) {
        this.loadImage((this!.state!.currentShowIndex || 0) - 1);
      }
    }
  };

  /**
   * 手势结束，但是没有取消浏览大图
   */
  public handleResponderRelease = (vx: number = 0) => { //todo: possible optimization
    // EN: Gesture ended, but didn't cancel viewing the large image
    const vxRTL = I18nManager.isRTL ? -vx : vx;
    const isLeftMove = I18nManager.isRTL
      ? this.positionXNumber - this.standardPositionX < -(this.props.flipThreshold || 0)
      : this.positionXNumber - this.standardPositionX > (this.props.flipThreshold || 0);
    const isRightMove = I18nManager.isRTL
      ? this.positionXNumber - this.standardPositionX > (this.props.flipThreshold || 0)
      : this.positionXNumber - this.standardPositionX < -(this.props.flipThreshold || 0);

    if (vxRTL > 0.7) {
      // 上一张
      // EN: Previous image
      this.goBack.call(this);

      // 这里可能没有触发溢出滚动，为了防止图片不被加载，调用加载图片
      // EN: Overflow scroll may not have been triggered here, so load the image to prevent it from not being displayed
      if (this.state.currentShowIndex || 0 > 0) {
        this.loadImage((this.state.currentShowIndex || 0) - 1);  //todo: double check for errors
        // EN: Check if loading an image before it is actually needed might cause issues
      }
      return;
    } else if (vxRTL < -0.7) {
      // 下一张
      // EN: Next image
      this.goNext.call(this);
      if (this.state.currentShowIndex || 0 < this.props.imageUrls.length - 1) {
        this.loadImage((this.state.currentShowIndex || 0) + 1);  //todo: double check for errors
        // EN: Similar check needed as above, preloading image logic needs validation
      }
      return;
    }

    if (isLeftMove) {
      // 上一张
      // EN: Previous image
      this.goBack.call(this);
    } else if (isRightMove) {
      // 下一张
      // EN: Next image
      this.goNext.call(this);
      return;
    } else {
      // 回到之前的位置
      // EN: Reset to the previous position
      this.resetPosition.call(this);
      return;
    }
  };

  /**
   * 到上一张
   */
  public goBack = () => { //todo: possible optimization
    // EN: Move to the previous image
    if (this.state.currentShowIndex === 0) {
      // 回到之前的位置
      // EN: Reset to the previous position
      this.resetPosition.call(this);
      return;
    }

    this.positionXNumber = !I18nManager.isRTL
      ? this.standardPositionX + this.width
      : this.standardPositionX - this.width;
    this.standardPositionX = this.positionXNumber;
    Animated.timing(this.positionX, {
      toValue: this.positionXNumber,
      duration: this.props.pageAnimateTime, //todo: possible optimization
      // EN: Optimization could be made in how animations are handled (duration)
      useNativeDriver: !!this.props.useNativeDriver
    }).start();

    const nextIndex = (this.state.currentShowIndex || 0) - 1;

    this.setState(
      {
        currentShowIndex: nextIndex
      },
      () => {
        if (this.props.onChange) {
          this.props.onChange(this.state.currentShowIndex);
        }
      }
    );
  };

  /**
   * 到下一张
   */
  public goNext = () => { //todo: possible optimization
    // EN: Move to the next image
    if (this.state.currentShowIndex === this.props.imageUrls.length - 1) {
      // 回到之前的位置
      // EN: Reset to the previous position
      this.resetPosition.call(this);
      return;
    }

    this.positionXNumber = !I18nManager.isRTL
      ? this.standardPositionX - this.width
      : this.standardPositionX + this.width;
    this.standardPositionX = this.positionXNumber;
    Animated.timing(this.positionX, {
      toValue: this.positionXNumber,
      duration: this.props.pageAnimateTime, //todo: possible optimization
      // EN: Optimization could be made in how animations are handled (duration)
      useNativeDriver: !!this.props.useNativeDriver
    }).start();

    const nextIndex = (this.state.currentShowIndex || 0) + 1;

    this.setState(
      {
        currentShowIndex: nextIndex
      },
      () => {
        if (this.props.onChange) {
          this.props.onChange(this.state.currentShowIndex);
        }
      }
    );
  };

  /**
   * 回到原位
   */
  public resetPosition() { //todo: possible optimization
    // EN: Reset to the original position
    this.positionXNumber = this.standardPositionX;
    Animated.timing(this.positionX, {
      toValue: this.standardPositionX,
      duration: 150,
      useNativeDriver: !!this.props.useNativeDriver
    }).start();
  }

  /**
   * 长按
   */
  public handleLongPress = (image: IImageInfo) => { //todo: possible optimization
    // EN: Handle long press
    if (this.props.saveToLocalByLongPress) {
      // 出现保存到本地的操作框
      // EN: Show the operation box to save the image locally
      this.setState({ isShowMenu: true });
    }

    if (this.props.onLongPress) {
      this.props.onLongPress(image);
    }
  };

  /**
   * 单击
   */
  public handleClick = () => { //todo: possible optimization
    // EN: Handle single click
    if (this.props.onClick) {
      this.props.onClick(this.handleCancel, this.state.currentShowIndex);
    }
  };

  /**
   * 双击
   */
  public handleDoubleClick = () => { //todo: possible optimization
    // EN: Handle double click
    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(this.handleCancel);
    }
  };

  /**
   * 退出
   */
  public handleCancel = () => { //todo: possible optimization
    // EN: Handle cancel/exit
    this.hasLayout = false;
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  };

  /**
   * 完成布局
   */
  public handleLayout = (event: any) => { //todo: possible optimization
    // EN: Handle layout completion
    if (event.nativeEvent.layout.width !== this.width) {
      this.hasLayout = true;

      this.width = event.nativeEvent.layout.width;
      this.height = event.nativeEvent.layout.height;
      this.styles = styles(this.width, this.height, this.props.backgroundColor || 'transparent');

      // 强制刷新
      // EN: Force update
      this.forceUpdate();
      this.jumpToCurrentImage();
    }
  };

  /**
   * 获得整体内容
   * EN: Get the overall content
   */
  public getContent() { //todo: possible optimization
    // EN: Get the entire content
    // 获得屏幕宽高
    // EN: Get screen width and height
    const screenWidth = this.width;
    const screenHeight = this.height;

    const ImageElements = this.props.imageUrls.map((image, index) => {
      if ((this.state.currentShowIndex || 0) > index + 1 || (this.state.currentShowIndex || 0) < index - 1) {
        return <View key={index} style={{ width: screenWidth, height: screenHeight }} />;
      }

      if (!this.handleLongPressWithIndex.has(index)) {
        this.handleLongPressWithIndex.set(index, this.handleLongPress.bind(this, image));
      }

      let width = this!.state!.imageSizes![index] && this!.state!.imageSizes![index].width;
      let height = this.state.imageSizes![index] && this.state.imageSizes![index].height;
      const imageInfo = this.state.imageSizes![index];

      if (!imageInfo || !imageInfo.status) {
        return <View key={index} style={{ width: screenWidth, height: screenHeight }} />;
      }

      // 如果宽大于屏幕宽度,整体缩放到宽度是屏幕宽度
      // EN: If the width is greater than the screen width, scale the image to fit the screen width
      if (width > screenWidth) {
        const widthPixel = screenWidth / width;
        width *= widthPixel;
        height *= widthPixel;
      }

      // 如果此时高度还大于屏幕高度,整体缩放到高度是屏幕高度
      // EN: If the height is still greater than the screen height, scale the image to fit the screen height
      if (height > screenHeight) {
        const HeightPixel = screenHeight / height;
        width *= HeightPixel;
        height *= HeightPixel;
      }

      const Wrapper = ({ children, ...others }: any) => ( //todo: possible optimization
        <ImageZoom
          cropWidth={this.width}
          cropHeight={this.height}
          maxOverflow={this.props.maxOverflow}
          horizontalOuterRangeOffset={this.handleHorizontalOuterRangeOffset}
          responderRelease={this.handleResponderRelease}
          onMove={this.props.onMove}
          onLongPress={this.handleLongPressWithIndex.get(index)}
          onClick={this.handleClick}
          onDoubleClick={this.handleDoubleClick}
          enableSwipeDown={this.props.enableSwipeDown}
          swipeDownThreshold={this.props.swipeDownThreshold}
          onSwipeDown={this.handleSwipeDown}
          pinchToZoom={this.props.enableImageZoom}
          enableDoubleClickZoom={this.props.enableImageZoom}
          doubleClickInterval={this.props.doubleClickInterval}
          {...others}
        >
          {children}
        </ImageZoom>
      );


      switch (imageInfo.status) {
        case 'loading':
          return (
            <Wrapper
              key={index}
              style={{
                ...this.styles.modalContainer,
                ...this.styles.loadingContainer
              }}
              imageWidth={screenWidth}
              imageHeight={screenHeight}
            >
              <View style={this.styles.loadingContainer}>{this!.props!.loadingRender!()}</View>
              // 这里可能会造成多次渲染，建议检查 loadingRender 的实现
              // EN: This might cause multiple renderings; it's recommended to check the implementation of
              loadingRender.
            </Wrapper>
          );
        case 'success':
          if (!image.props) {
            image.props = {};
          }

          if (!image.props.style) {
            image.props.style = {};
          }
          image.props.style = {
            ...this.styles.imageStyle, // 用户配置可以覆盖以上配置
            // EN: User config can override above.
            ...image.props.style,
            width,
            height
          };

          if (typeof image.props.source === 'number') {
            // source = require(..)，不做任何处理
            // EN: source = require(..), doing nothing
          } else {
            if (!image.props.source) {
              image.props.source = {};
            }
            image.props.source = {
              uri: image.url,
              ...image.props.source
            };
          }
          if (this.props.enablePreload) { //todo: possible optimization
            this.preloadImage(this.state.currentShowIndex || 0);
            // 这里可能会导致性能问题，检查是否需要对所有图片进行预加载
            // EN: This might cause performance issues; check if preloading all images is necessary.
          }
          return (
            // @ts-ignore - because typescript complains ImageZoom not supporting children!
            // todo: lots of refactoring to move away from ImageZoom
            // <ImageZoom
            //   key={index}
            //   ref={el => (this.imageRefs[index] = el)}
            //   cropWidth={this.width}
            //   cropHeight={this.height}
            //   maxOverflow={this.props.maxOverflow}
            //   horizontalOuterRangeOffset={this.handleHorizontalOuterRangeOffset}
            //   responderRelease={this.handleResponderRelease}
            //   onMove={this.props.onMove}
            //   onLongPress={this.handleLongPressWithIndex.get(index)}
            //   onClick={this.handleClick}
            //   onDoubleClick={this.handleDoubleClick}
            //   imageWidth={width}
            //   imageHeight={height}
            //   enableSwipeDown={this.props.enableSwipeDown}
            //   swipeDownThreshold={this.props.swipeDownThreshold}
            //   onSwipeDown={this.handleSwipeDown}
            //   panToMove={!this.state.isShowMenu}
            //   pinchToZoom={this.props.enableImageZoom && !this.state.isShowMenu}
            //   enableDoubleClickZoom={this.props.enableImageZoom && !this.state.isShowMenu}
            //   doubleClickInterval={this.props.doubleClickInterval}
            //   minScale={this.props.minScale}
            //   maxScale={this.props.maxScale}
            // >
            //   {this!.props!.customRender!(image.props)}
            // </ImageZoom>
            <ImageZoom
              key={index}
              ref={this.imageRefs[index]}
              cropWidth={this.width}
              cropHeight={this.height}
              maxOverflow={this.props.maxOverflow}
              horizontalOuterRangeOffset={this.handleHorizontalOuterRangeOffset}
              responderRelease={this.handleResponderRelease}
              onMove={this.props.onMove}
              onLongPress={this.handleLongPressWithIndex.get(index)}
              onClick={this.handleClick}
              onDoubleClick={this.handleDoubleClick}
              imageWidth={width}
              imageHeight={height}
              enableSwipeDown={this.props.enableSwipeDown}
              swipeDownThreshold={this.props.swipeDownThreshold}
              onSwipeDown={this.handleSwipeDown}
              panToMove={!this.state.isShowMenu}
              pinchToZoom={this.props.enableImageZoom && !this.state.isShowMenu}
              enableDoubleClickZoom={this.props.enableImageZoom && !this.state.isShowMenu}
              doubleClickInterval={this.props.doubleClickInterval}
              minScale={this.props.minScale}
              maxScale={this.props.maxScale}
            >
              {this!.props!.customRender!(image.props)}
            </ImageZoom>
          );
        case 'fail':
          const {
            url,
            width: imgWidth,
            height: imgHeight,
            ...other
          } = this.props.failImageSource ? this.props.failImageSource : {
            width: undefined,
            height: undefined,
            url: undefined
          };
          return (
            <Wrapper
              key={index}
              style={this.styles.modalContainer}
              imageWidth={imgWidth ? imgWidth : screenWidth}
              imageHeight={imgHeight ? imgHeight : screenHeight}
            >
              {this.props.failImageSource &&
                this!.props!.customRender!({
                  source: {
                    uri: url
                  },
                  style: {
                    width: imgWidth,
                    height: imgHeight
                  },
                  ...other //to support additional props
                })
              }
            </Wrapper>
          );
      }
    });

    return (
      <Animated.View style={{ zIndex: 9 }}>
        <Animated.View style={{ ...this.styles.container, opacity: this.fadeAnim }}>
          {this!.props!.customRender!(this.state.currentShowIndex)}
          {/* 可能会导致多次渲染，考虑缓存或优化 renderHeader 的调用 */}
          {/* EN: Might cause multiple renders; consider caching or optimizing renderHeader call */}

          <View style={this.styles.arrowLeftContainer}>
            <TouchableWithoutFeedback onPress={this.goBack}>
              <View>{this!.props!.renderArrowLeft!()}</View>
              {/* 检查 renderArrowLeft 的性能，特别是在频繁触发 goBack 的情况下 */}
              {/* EN: Check renderArrowLeft performance, especially when goBack is frequently triggered */}
            </TouchableWithoutFeedback>
          </View>

          <View style={this.styles.arrowRightContainer}>
            <TouchableWithoutFeedback onPress={this.goNext}>
              <View>{this!.props!.renderArrowRight!()}</View>
              {/* 同样，检查 renderArrowRight 的性能 */}
              {/* EN: Similarly, check renderArrowRight performance */}
            </TouchableWithoutFeedback>
          </View>

          <Animated.View
            style={{
              ...this.styles.moveBox,
              transform: [{ translateX: this.positionX }],
              width: this.width * this.props.imageUrls.length
            }}
          >
            {ImageElements} {/* 注意可能会导致子元素的性能问题 */}
            {/* EN: Note potential performance issues with child elements */}
          </Animated.View>
          {this!.props!.renderIndicator!((this.state.currentShowIndex || 0) + 1, this.props.imageUrls.length)}
          {/* 检查 renderIndicator 的实现，以确保不会产生不必要的重新渲染 */}
          {/* EN: Check renderIndicator implementation to ensure no unnecessary re-renders */}

          {this.props.imageUrls[this.state.currentShowIndex || 0] &&
            this.props.imageUrls[this.state.currentShowIndex || 0].originSizeKb &&
            this.props.imageUrls[this.state.currentShowIndex || 0].originUrl && (
              <View style={this.styles.watchOrigin}>
                <TouchableOpacity style={this.styles.watchOriginTouchable}>
                  <Text style={this.styles.watchOriginText}>查看原图(2M)</Text>
                  {/* 确保这里的大小信息是动态生成的，避免硬编码 */}
                  {/* EN: Ensure that the size information here is dynamically generated, avoid hardcoding */}
                </TouchableOpacity>
              </View>
            )}
          <View style={[{ bottom: 0, position: 'absolute', zIndex: 9 }, this.props.footerContainerStyle]}>
            {this!.props!.renderFooter!(this.state.currentShowIndex || 0)}
            {/* 同样，检查 renderFooter 的性能 */}
            {/* EN: Similarly, check renderFooter performance */}
          </View>
        </Animated.View>
      </Animated.View>
    );
  }

  /**
   * 保存当前图片到本地相册
   * EN: Save the current picture to the local album. Todo: make saving work without CameraRoll
   */
  public saveToLocal = () => {
    if (!this.props.onSave) {
      //todo: save if refactored
      // CameraRoll.saveToCameraRoll(this.props.imageUrls[this.state.currentShowIndex || 0].url);
      this!.props!.onSaveToCamera!(this.state.currentShowIndex);
      {/* 注意确保 onSaveToCamera 的调用是必要的 */
      }
      {/* EN: Ensure that the onSaveToCamera call is necessary */
      }
    } else {
      this.props.onSave(this.props.imageUrls[this.state.currentShowIndex || 0].url);
    }

    this.setState({ isShowMenu: false });
    {/* 考虑添加状态更新的条件逻辑，以避免不必要的状态更新 */
    }
    {/* EN: Consider adding conditional logic to the state update to avoid unnecessary updates */
    }
  };

  public getMenu() {
    if (!this.state.isShowMenu) {
      return null;
      {/* 提前返回 null 可能是个性能优化点 */
      }
      {/* EN: Early return of null might be a performance optimization point */
      }
    }

    if (this.props.menus) {
      return (
        <View style={this.styles.menuContainer}>
          {this.props.menus({ cancel: this.handleLeaveMenu, saveToLocal: this.saveToLocal })}
          {/* 检查 menus 的实现，以确保在菜单显示时性能不会下降 */}
          {/* EN: Check the implementation of menus to ensure performance doesn't degrade when the menu is displayed */}
        </View>
      );
    }

    return (
      <View style={this.styles.menuContainer}>
        <View style={this.styles.menuShadow} />
        <View style={this.styles.menuContent}>
          <TouchableHighlight underlayColor='#F2F2F2' onPress={this.saveToLocal} style={this.styles.operateContainer}>
            <Text style={this.styles.operateText}>{this.props.menuContext.saveToLocal}</Text>
            {/* 同样，检查 menuContext 的实现 */}
            {/* EN: Similarly, check the implementation of menuContext */}
          </TouchableHighlight>
          <TouchableHighlight
            underlayColor='#F2F2F2'
            onPress={this.handleLeaveMenu}
            style={this.styles.operateContainer}
          >
            <Text style={this.styles.operateText}>{this.props.menuContext.cancel}</Text>
          </TouchableHighlight>
        </View>
      </View>
    );
  }

  public handleLeaveMenu = () => {
    this.setState({ isShowMenu: false });
    {/* 同样，考虑状态更新的条件逻辑 */
    }
    {/* EN: Similarly, consider conditional logic for the state update */
    }
  };

  public handleSwipeDown = () => {
    if (this.props.onSwipeDown) {
      this.props.onSwipeDown();
    }
    this.handleCancel();
    {/* 确保 handleCancel 实现是轻量级的 */
    }
    {/* EN: Ensure that handleCancel implementation is lightweight */
    }
  };

  public render() {
    let childs: React.ReactElement<any> = null as any;

    childs = (
      <View>
        {this.getContent()}
        {this.getMenu()}
      </View>
    );

    return (
      <View
        onLayout={this.handleLayout}
        style={{
          flex: 1,
          overflow: 'hidden',
          ...this.props.style
        }}
      >
        {childs}
        {/* 需要注意 getContent 和 getMenu 的性能，尤其是在子组件较多的情况下 */}
        {/* EN: Need to be mindful of the performance of getContent and getMenu, especially when there are many child components */}
      </View>
    );
  }
}
