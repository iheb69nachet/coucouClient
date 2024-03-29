
// this page is not implemented you can use firebase notifiction service

import React from 'react';
import { Notifications } from '../components';

import { 
    StyleSheet,
    View,
    Text,
    StatusBar,
    TouchableWithoutFeedback
  } from 'react-native';
import { Header } from 'react-native-elements';
import { colors } from '../common/theme';
import  languageJSON  from '../common/language';
export default class NotificationPage extends React.Component {
    constructor(props){
        super(props);
    }

  render() {
    return (
        <View style={styles.mainView}>
            <Header 
                backgroundColor={colors.GREY.default}
                leftComponent={{icon:'md-menu', type:'ionicon', color: colors.WHITE, size: 30, component: TouchableWithoutFeedback,onPress: ()=>{this.props.navigation.toggleDrawer();} }}
                centerComponent={<Text style={styles.headerTitleStyle}>{languageJSON.notification_headerText}</Text>}
                rightComponent={{icon:'ios-notifications', type:'ionicon', color: colors.WHITE, size: 30, component: TouchableWithoutFeedback,onPress: ()=>{} }}
                containerStyle={styles.headerStyle}
                innerContainerStyles={{marginLeft:10, marginRight: 10}}
            />
            <Notifications></Notifications>
        </View>
    );
  }
}

const styles = StyleSheet.create({
    headerStyle: { 
        backgroundColor: colors.GREY.default, 
        borderBottomWidth: 0 
    },
    headerTitleStyle: { 
        color: colors.WHITE,
        
        fontSize: 20
    },
    containerView:{
         flex:1 
        },
    textContainer:{
        textAlign:"center"
    },
    mainView:{ 
        flex:1,
        backgroundColor: colors.WHITE, 
        //marginTop: StatusBar.currentHeight
    } 
});
