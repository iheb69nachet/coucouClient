import React from 'react';
import { 
    StyleSheet,
    View,
    Image,
    Dimensions,
    TouchableOpacity,
    Text,
    StatusBar,
    TouchableWithoutFeedback, 
    Platform,
    Alert,
    Modal,
    ScrollView
  } from 'react-native';
import { MapComponent} from '../components';
import { Icon, Button,Avatar, Header } from 'react-native-elements';
import { colors } from '../common/theme';

import * as Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
var { height, width } = Dimensions.get('window');
import  {GeoFire} from 'geofire';
import * as firebase from 'firebase'
import { AnimatedRegion } from 'react-native-maps';
import { google_map_key } from '../common/key';
import  languageJSON  from '../common/language';
import { Currency } from '../common/CurrencySymbol';
export default class MapScreen extends React.Component {

   bonusAmmount = 0;
//   allCabs = '';
  constructor(props){
    super(props);
    this.state = {
        loadingModal:false,
        giftModal:false,
        location: null,
        errorMessage: null,
        region: {
            latitude: 9.061460,
            longitude: 7.500640,
            latitudeDelta: 0.9922,
            longitudeDelta: 0.9421,
        },
        whereText: languageJSON.map_screen_where_input_text,
        dropText: languageJSON.map_screen_drop_input_text,
        backgroundColor: colors.WHITE,
        carType:"",
        coordinate: new AnimatedRegion({
            latitude: 9.061460,
            longitude:7.500640,
        }),
        allRiders:[],
        passData :{
            droplatitude: 0,
            droplongitude: 0,
            droptext: "",
            whereText: "",
            wherelatitude: 0,
            wherelongitude: 0,
            carType:'',
        },
        allCars: [],
        nearby:[],
        mainCarTypes:[],
        checkCallLocation:''
    }
   
  }

 allCarsData(){
    const cars=firebase.database().ref('rates/car_type');
    cars.once('value',allCars=>{
        if(allCars.val()){
          let cars = allCars.val()
          let arr = [];
          for(key in cars){
            cars[key].minTime = ''
            cars[key].available = true;
            cars[key].active = false;
            arr.push(cars[key]);
          }
          this.setState({mainCarTypes:arr});
        }
       
    })
 }


  async componentWillMount() {  
    if (Platform.OS === 'android' && !Constants.default.isDevice) {
        this.setState({
          errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
        });
      } else {
          if(this.state.passData.wherelatitude == 0){
            this._getLocationAsync();
          }        
      }

    let searchObj = await this.props.navigation.getParam('searchObj') ? this.props.navigation.getParam('searchObj') : null;

      if(searchObj) {   
          
          if(searchObj.searchFrom == 'where') {
            
            if(searchObj.searchDetails){
                console.log( this.props.navigation.getParam('old'));
                this.setState({
                    region: {
                      latitude: searchObj.searchDetails.geometry.location.lat,
                      longitude: searchObj.searchDetails.geometry.location.lng,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    },
                    whereText: searchObj.whereText,
                    dropText: searchObj.dropText,
                    carType:this.state.passData.carType,
                    loadingModal:true,
                    passData : this.props.navigation.getParam('old'),
                    checkCallLocation:'navigation'
                },()=>{
                    this.getDrivers();
                })
                }
          }else {
            if(searchObj.searchDetails){
                this.setState({
                    region: {
                      latitude: searchObj.searchDetails.geometry.location.lat,
                      longitude: searchObj.searchDetails.geometry.location.lng,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    },
                    whereText: searchObj.whereText,
                    dropText: searchObj.dropText
                  })
                  this.setState({passData : this.props.navigation.getParam('old')});
                  this.setState({
                      carType:this.state.passData.carType,
                      loadingModal:true,
                      checkCallLocation:'navigation'
                  },()=>{
                    this.getDrivers();
                })
                }
          }
         
      }
        this.allCarsData();
        this.onPressModal();

        
  }


  componentDidMount(){
    setInterval(()=>{
        if(this.state.passData && this.state.passData.wherelatitude){
            this.setState({
                checkCallLocation:'interval'
            })
            this.getDrivers();
        }
    },30000)
  }

  loading(){
    return(
       <Modal
               animationType="fade"
               transparent={true}
               visible={this.state.loadingModal}
               onRequestClose={() => {
               this.setState({loadingModal:false})
           }}
           >
           <View style={{flex: 1, backgroundColor: "rgba(22,22,22,0.8)", justifyContent: 'center', alignItems: 'center' }}>
               <View style={{width: '85%', backgroundColor: "#DBD7D9", borderRadius: 10, flex: 1, maxHeight: 70}}> 
               <View style={{ alignItems: 'center',flexDirection:'row',flex:1,justifyContent:"center"}}>
                    <Image
                       style={{width:80,height:80,backgroundColor:colors.TRANSPARENT}}
                       source={require('../../assets/images/loader.gif')}
                       />
                  <View style={{flex:1}}>
                           <Text style={{color:"#000",fontSize:16,}}>{languageJSON.driver_finding_alert}</Text>
                   </View>
               </View>
               </View>
           </View>
           </Modal>
    )
   }


 _getLocationAsync = async () => {

    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }
    let location = await Location.getCurrentPositionAsync({})
        if(location){
            var pos = {
                latitude:  location.coords.latitude,
                longitude: location.coords.longitude,
              };
              var curuser = firebase.auth().currentUser.uid;
            
             if(pos){
              let latlng = pos.latitude + ','+pos.longitude;
              return fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng='+latlng+'&key=' + google_map_key)
              .then((response) => response.json())
              .then((responseJson) => {
              if(this.state.passData.wherelatitude == 0){
                this.setState({
                    whereText: responseJson.results[0].formatted_address,
                    region: {
                        latitude: pos.latitude,
                        longitude: pos.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    },
                    loadingModal:true,
                },()=>{
                    
                    
                    let obj = {}
                    obj = this.state.passData;
                    obj.wherelatitude = pos.latitude
                    obj.wherelongitude = pos.longitude
                    obj.whereText = responseJson.results[0].formatted_address;
                    this.setState({
                        passData:obj,
                        checkCallLocation:'navigation'
                    })
                    this.getDrivers();
                    firebase.database().ref('users/' + curuser+'/location').update({ 
                        add:responseJson.results[0].formatted_address,
                        lat:pos.latitude,
                        lng:pos.longitude
                    }) 
                });
                
                }else{
                    this.setState({loadingModal:true});
                    let obj = {}
                    obj = this.state.passData;
                    obj.wherelatitude = pos.latitude
                    obj.wherelongitude = pos.longitude
                    obj.whereText = responseJson.results[0].formatted_address;
                    this.setState({
                        passData:obj,
                        checkCallLocation:'navigation'
                    })
                    this.getDrivers();
                    firebase.database().ref('users/' + curuser+'/location').update({ 
                        add:responseJson.results[0].formatted_address,
                        lat:pos.latitude,
                        lng:pos.longitude
                    }) 
                }
    
              })
              .catch((error) =>{
                console.error(error);
              });
            }
          }
   }



  //Go to confirm booking page
  onPressBook() {
   if((this.state.passData.whereText == "" || this.state.passData.wherelatitude  == 0 || this.state.passData.wherelongitude == 0 )&& (this.state.passData.dropText  == "" || this.state.passData.droplatitude  == 0 || this.state.passData.droplongitude == 0)){
        alert(languageJSON.pickup_and_drop_location_blank_error)
    }else{
        if(this.state.passData.whereText == "" || this.state.passData.wherelatitude == 0 || this.state.passData.wherelongitude == 0){
        alert(languageJSON.pickup_location_blank_error)
        }else if(this.state.passData.dropText == "" || this.state.passData.droplatitude == 0 || this.state.passData.droplongitude == 0){
            alert(languageJSON.drop_location_blank_error)
        }else if(this.state.passData.carType == "" || this.state.passData.carType == undefined){
            alert(languageJSON.car_type_blank_error)
        }else{
            this.state.passData.latitudeDelta = "0.0922" ;
            this.state.passData.longitudeDelta= "0.0421";
             
            this.props.navigation.navigate('FareDetails',{data:this.state.passData,carType:this.state.passData.carType,carimage:this.state.passData.carImage});
        }
    }
   
  }
  
  
  selectCarType(value,key){
    //   console.log(value)
    //   let allCars = this.state.allCars;
    //   for(let i =0; i<allCars.length; i++){
    //      allCars[i].active = true;
    //       if(i == key){
    //         allCars[i].active = true;
    //       }
    //   }
    //   this.setState({
    //     allCars:allCars
    //  },()=>{
    //         this.state.passData.carType = value.name;
    //         this.state.passData.carImage = value.image;
    //     })
        console.log(value)
  }




  getDriverTime(startLoc,destLoc) {
    return new Promise(function(resolve, reject) {
        fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${startLoc}&destinations=${destLoc}&key=${ google_map_key }`)
            .then((response) => response.json())
            .then((res) => 
                resolve({
                    distance_in_meter:  res.rows[0].elements[0].distance.value,
                    time_in_secs:  res.rows[0].elements[0].duration.value,
                    timein_text:  res.rows[0].elements[0].duration.text
                })
            )
            .catch(error=>{
                reject(error);
            });
    });
  }
 
  async getDrivers(){

    const userData=firebase.database().ref('users/');

     userData.once('value',userData=>{
        if(userData.val()){
          let allUsers = userData.val();
           this.prepareDrivers(allUsers);     
        }
    })
  }

  async prepareDrivers(allUsers){
    let availableDrivers =[];
    let arr = {};
    let riderLocation = [this.state.passData.wherelatitude,this.state.passData.wherelongitude];
    let startLoc = '"'+this.state.passData.wherelatitude+', '+this.state.passData.wherelongitude+'"';
    
    for(let key in allUsers){
        let driver = allUsers[key];
        if((driver.usertype) && (driver.usertype == 'driver')  ){
            // let driverLocation = [driver.location.lat,driver.location.lng];
            // let distance = GeoFire.distance(riderLocation, driverLocation);
            // let destLoc = '"'+ driver.location.lat+', '+ driver.location.lng+'"';
            // driver.arriveDistance = distance;
            // //driver.arriveTime  = await this.getDriverTime(startLoc,destLoc);
             let carType = driver.vehicleModel;

      //console.log(arr[carType].driver)
      arr[carType] = {};
      arr[carType].drivers = [];
      arr[carType].drivers.push(driver);
      arr[carType].minDistance = '';
      arr[carType].minTime = '';
      availableDrivers.push(driver);

        
        }
    }
    const allCars = this.state.mainCarTypes.slice();
    console.log(allCars);
    for(let i=0;i<allCars.length;i++){
       
             allCars[i].nearbyData=arr[allCars[i].name].drivers;
             allCars[i].minTime = arr[allCars[i].name].minTime;
             allCars[i].available = true;
      
         allCars[i].active = false;
//console.log(arr[allCars[i].nearbyData]);
    }
    this.setState({
        allCars:allCars,
        loadingModal:false,
        nearby:availableDrivers
    });

    if(availableDrivers.length==0){
        
        this.showNoDriverAlert();
    }




  

  }



  showNoDriverAlert() {
      if(this.state.checkCallLocation == 'navigation'){
        Alert.alert(
            languageJSON.no_driver_found_alert_title,
            languageJSON.no_driver_found_alert_messege,
            [
             {
               text: languageJSON.no_driver_found_alert_OK_button,
               onPress: () => this.setState({loadingModal:false}),
             },
             {text: languageJSON.no_driver_found_alert_TRY_AGAIN_button, onPress: () => {this._getLocationAsync()},  style: 'cancel',},
           ],
           {cancelable: true},
        )
      }
    
}

  onPressCancel(){
    this.setState({
        giftModal:false
    })
  }


  bonusModal(){
    return (
    <Modal
            animationType="fade"
            transparent={true}
            visible={this.state.giftModal}
            onRequestClose={() => {
            this.setState({giftModal:false})
        }}
        >
        <View style={{flex: 1, backgroundColor: "rgba(22,22,22,0.8)", justifyContent: 'center', alignItems: 'center' }}>
            <View style={{width: '80%', backgroundColor: "#fffcf3", borderRadius: 10, justifyContent: 'center', alignItems: 'center', flex: 1, maxHeight: 325}}> 
            <View style={{marginTop:0,alignItems:"center"}}>
            <Avatar
                rounded
                size={200}
                source={require('../../assets/images/gift.gif')}
                containerStyle={{width:200,height:200,marginTop:0,alignSelf:"center",position:"relative"}}
                />
           <Text style={{color:"#0cab03",fontSize:28,textAlign:"center",position:"absolute",marginTop:170}}>{languageJSON.congratulation}</Text>
            <View>
    <Text style={{color:"#000",fontSize:16,marginTop:12,textAlign:"center"}}>{languageJSON.refferal_bonus_messege_text} {Currency}{this.bonusAmmount}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    title={languageJSON.no_driver_found_alert_OK_button}
                    loading={false}
                    titleStyle={styles.buttonTitleText}
                    onPress={()=>{this.onPressCancel()}}
                    buttonStyle={styles.cancelButtonStyle}
                    containerStyle={{marginTop:20}}
                />
            </View>
            </View>       
            </View>
        </View>
        </Modal>
    );
}

onPressModal(){
  
    var curuser = firebase.auth().currentUser.uid;
    const userRoot=firebase.database().ref('users/'+curuser);
    userRoot.once('value',userData=>{
        if(userData.val()){
            if(userData.val().refferalId == undefined){
                let name = userData.val().firstName?userData.val().firstName.toLowerCase():'';
                let uniqueNo = Math.floor(Math.random() * 9000) + 1000;
                let refId = name + uniqueNo;
                userRoot.update({
                    refferalId:refId,
                    walletBalance:0,
                }).then(()=>{
                    if(userData.val().signupViaReferral == true){                  
                                firebase.database().ref('referral/bonus').once('value',referal=>{
                                    if(referal.val()){
                                        this.bonusAmmount = referal.val().amount;        
                                        userRoot.update({
                                            walletBalance:this.bonusAmmount
                                        }).then(()=>{
                                            this.setState({
                                                giftModal:true
                                            })
                                        })
                                    }
                            }) 
                    }
                })    
            }
        }
    })
}


  render() {
    return (
      <View style={styles.mainViewStyle}>
        <Header 
            backgroundColor={colors.GREY.default}
            leftComponent={{icon:'md-menu', type:'ionicon', color: colors.WHITE, size: 30, component: TouchableWithoutFeedback,onPress: ()=>{this.props.navigation.toggleDrawer();} }}
            centerComponent={<Text style={styles.headerTitleStyle}>{languageJSON.map_screen_title}</Text>}
            containerStyle={styles.headerStyle}
            innerContainerStyles={styles.inrContStyle}
        />

        <View style={styles.myViewStyle}>
            <View style={styles.coverViewStyle}>
                <View style={styles.viewStyle1}/>
                <View style={styles.viewStyle2}/>
                <View style={styles.viewStyle3}/>
            </View>
            <View style={styles.iconsViewStyle}>
                <TouchableOpacity onPress={()=>{this.props.navigation.navigate('Search',{from:"where",whereText:this.state.whereText,dropText:this.state.dropText,old:this.state.passData});}} style={styles.contentStyle}>
                    <View style={styles.textIconStyle}>
                        <Text numberOfLines={1} style={styles.textStyle}>{this.state.whereText}</Text>
                        <Icon
                            name='gps-fixed'
                            color={colors.WHITE}
                            size={23}
                            containerStyle={{flex:1}}
                        />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>{this.props.navigation.navigate('Search',{from:"drop",whereText:this.state.whereText,dropText:this.state.dropText,old:this.state.passData});}} style={styles.searchClickStyle}>
                    <View style={styles.textIconStyle}>
                        <Text numberOfLines={1} style={styles.textStyle}>{this.state.dropText}</Text>
                        <Icon
                            name='search'
                            type='feather'
                            color={colors.WHITE}
                            size={23}
                            containerStyle={{flex:1}}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </View> 
        <View style={styles.mapcontainer}>
            <MapComponent 
                markerRef={marker => { this.marker = marker; }} 
                mapStyle={styles.map} 
                mapRegion={this.state.region} 
                nearby = {this.state.nearby} 
                markerCord={this.state.passData} 
            />
        </View>
        <View style={styles.compViewStyle}>
            <Text style={styles.pickCabStyle}>{languageJSON.cab_selection_title}</Text>
            <Text style={styles.sampleTextStyle}>{languageJSON.cab_selection_subtitle}</Text>
            <ScrollView horizontal={true} style={styles.adjustViewStyle} showsHorizontalScrollIndicator={false}>
                {this.state.allCars.map((prop, key) => {
                return (
                <TouchableOpacity key={key} style={styles.cabDivStyle} onPress={()=>{console.log("aaaa")}} disabled={prop.minTime == ''} >
                    <View style={[styles.imageStyle,{ 
                    backgroundColor: prop.active == true?colors.YELLOW.secondary:colors.WHITE}]
                    }>
                        <Image source={prop.image?{uri:prop.image}:require('../../assets/images/microBlackCar.png')} style={styles.imageStyle1} />
                    </View>
                    <View style={styles.textViewStyle}>
                         <Text style={styles.text1}>{prop.name.toUpperCase()}</Text> 
                        <Text style={styles.text2}>{prop.minTime != ''? languageJSON.not_available: prop.minTime }</Text>
                    </View>
                </TouchableOpacity>
            
                );
                })}
            </ScrollView>
            <View style={{flex:0.5}}>
                <Button
                    title={languageJSON.book_now_button}
                    loading={false}
                    loadingProps={{ size: "large", color: colors.BLUE.default.primary }}
                    titleStyle={{color: colors.WHITE, fontSize: 18,}}
                    onPress={()=>{this.onPressBook()}}
                    buttonStyle={{width: width, backgroundColor: colors.GREY.btnPrimary,elevation: 0}}
                    containerStyle={{flex: 1, backgroundColor: colors.GREY.btnPrimary}}
                />
            </View>
          
        </View>
    
        {
             this.bonusModal()
        }
        {
            this.loading()
        }
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
        
        fontSize: 18
     },
    mapcontainer: {
        flex: 6,
        width: width,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    inrContStyle:{
        marginLeft:10, 
        marginRight: 10
    },
    mainViewStyle:{ 
        flex:1, 
        backgroundColor: colors.WHITE, 
        //marginTop: StatusBar.currentHeight 
    },
    myViewStyle:{ 
        flex: 1.5, 
        flexDirection: 'row',
        borderTopWidth:0, 
        alignItems: 'center', 
        backgroundColor: colors.GREY.default, 
        paddingEnd: 20 
    },
    coverViewStyle:{ 
        flex: 1.5, 
        alignItems:'center' 
    },
    viewStyle1:{
        height: 12, 
        width: 12, 
        borderRadius: 15/2, 
        backgroundColor: colors.YELLOW.light
    },
    viewStyle2:{
        height: height/25, 
        width: 1, 
        backgroundColor: colors.YELLOW.light
    },
    viewStyle3:{
        height: 14, 
        width: 14, 
        backgroundColor: colors.GREY.iconPrimary
    },
    iconsViewStyle:{
        flex: 9.5, 
        justifyContent: 'space-between'
    },
    contentStyle:{
         flex: 1, 
         justifyContent: 'center', 
         borderBottomColor: colors.WHITE, 
         borderBottomWidth: 1
        },
    textIconStyle:{
         flex: 1, 
         justifyContent: 'center', 
         alignItems:'center', 
         flexDirection: 'row'
        },
    textStyle:{
         flex:9, 
          
         fontSize: 14, 
         fontWeight: '400', 
         color: colors.WHITE
        },
    searchClickStyle:{
         flex: 1, 
         justifyContent: 'center'
        },
    compViewStyle:{
        flex: 3.5, 
        alignItems: 'center'
    },
    pickCabStyle:{ 
        flex: 0.3, 
        
        fontSize: 15, 
        fontWeight: '500', 
        color: colors.BLACK
    },
    sampleTextStyle:{ 
        flex: 0.2, 
         
        fontSize: 13, 
        fontWeight: '300', 
        color: colors.GREY.secondary
    },
    adjustViewStyle:{
        flex: 9, 
        flexDirection: 'row', 
        //justifyContent: 'space-around',
        marginTop:8
    },
    cabDivStyle : {
        flex: 1, 
        width : width/3,
        alignItems: 'center'
    },
    imageViewStyle:{
        flex: 2.7, 
        flexDirection: 'row', 
        justifyContent: 'space-around',
    },
    imageStyle:{
        height: height/14, 
        width: height/14, 
        borderRadius: height/14/2,
        borderWidth:3, 
        borderColor:colors.YELLOW.secondary, 
        //backgroundColor: colors.WHITE, 
        justifyContent: 'center',
        alignItems: 'center'
    },
    textViewStyle:{
        flex: 1, 
        alignItems: 'center'
    },
    text1:{ 
        
        
        fontSize: 14, 
        fontWeight: '900', 
        color: colors.BLACK
    },
    text2:{ 
         
        fontSize: 12, 
        fontWeight: '900', 
        color: colors.GREY.secondary
    },
    imagePosition:{
        height: height/14, 
        width: height/14, 
        borderRadius: height/14/2,
        borderWidth:3, 
        borderColor:colors.YELLOW.secondary, 
        //backgroundColor: colors.YELLOW.secondary, 
        justifyContent: 'center', 
        alignItems: 'center'
    },
    imageStyleView:{
        height: height/14, 
        width: height/14, 
        borderRadius: height/14/2, 
        borderWidth:3, 
        borderColor:colors.YELLOW.secondary, 
        //backgroundColor: colors.WHITE, 
        justifyContent: 'center', 
        alignItems: 'center'
    },
    imageStyle1:{
        height: height/20.5,
        width: height/20.5
    },
    imageStyle2:{
        height: height/20.5,
        width: height/20.5
    },
    buttonContainer: {
        flex:1
    },

   buttonTitleText: {
        color:colors.GREY.default, 
         
        fontSize: 20, 
        alignSelf:'flex-end'
    },

cancelButtonStyle: { 
        backgroundColor: "#edede8", 
        elevation: 0,
        width:"60%",
        borderRadius:5,
        alignSelf:"center"
    }
    
});