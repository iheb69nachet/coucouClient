import React from 'react';
import { AppLoading } from 'expo';
import {Asset} from 'expo-asset';
import * as Font from 'expo-font';
import AppContainer from './src/navigation/AppNavigator';

//Database import
import * as firebase from 'firebase'
var firebaseConfig = {
  apiKey: "AIzaSyD4kDp1mieL0uvYbDitKpgr09TUhcKY7g0",
  authDomain: "client-api-c86a6.firebaseapp.com",
  databaseURL: "https://client-api-c86a6.firebaseio.com",
  projectId: "client-api-c86a6",
  storageBucket: "client-api-c86a6.appspot.com",
  messagingSenderId: "223822577656",
  appId: "1:223822577656:web:0206361373213c5a1aa00d"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default class App extends React.Component {

  state = {
    assetsLoaded: false,
  };

  constructor(){
    super();
    console.disableYellowBox = true;
  }

  _loadResourcesAsync = async () => {
    return Promise.all([
      Asset.loadAsync([
        require('./assets/images/background.png'),
        require('./assets/images/logo.png'),
      ]),
      Font.loadAsync({
        'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
        'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
        'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
        'Roboto-Light': require('./assets/fonts/Roboto-Light.ttf'),
        
      }),
    ]);
  };

 
  render() {
    return (
        this.state.assetsLoaded ?    
          <AppContainer/>  
          :         
          <AppLoading
            startAsync={this._loadResourcesAsync}
            onFinish={() => this.setState({ assetsLoaded: true })}
            onError={console.warn}
            autoHideSplash={true}
          />
    );
  }
}