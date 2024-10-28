import React, { useState } from 'react';
import { View, Modal, TouchableNativeFeedback, Text } from 'react-native';
// import ImageViewer from '../built/index';
import ImageViewer from "react-native-image-zoom-viewer";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const images = [
  {
    // Simplest usage.
    // url: "https://avatars2.githubusercontent.com/u/7970947?v=3&s=460",
    // url:
    // "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1527660246058&di=6f0f1b19cf05a64317cbc5d2b3713d64&imgtype=0&src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F0112a85874bd24a801219c7729e77d.jpg",
    // You can pass props to <Image />.
    props: {
      // headers: ...
      source: require('./img.png')
    },
    freeHeight: true
  },
  {
    // Simplest usage.
    // url: "https://avatars2.githubusercontent.com/u/7970947?v=3&s=460",
    // url:
    // "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1527660246058&di=6f0f1b19cf05a64317cbc5d2b3713d64&imgtype=0&src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F0112a85874bd24a801219c7729e77d.jpg",
    // You can pass props to <Image />.
    props: {
      // headers: ...
      source: require('./img.png')
    },
    freeHeight: true
  }
];

const App = () => {
  const [state, setState] = useState({
    index: 0,
    modalVisible: true
  });

  return  <GestureHandlerRootView style={{ flex: 1 }}>
    <View
      style={{
        padding: 10
      }}
    >
      <Modal
        visible={state.modalVisible}
        transparent={true}
        onRequestClose={() => setState({ ...state, modalVisible: false })}
      >
        <ImageViewer
          imageUrls={images}
          index={state.index}
          onSwipeDown={() => {
            console.log('onSwipeDown');
          }}
          onMove={data => console.log(data)}
          enableSwipeDown={true}
        />
      </Modal>
    </View>
  </GestureHandlerRootView>;
};

export default App;