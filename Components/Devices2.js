import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

export default class Devices extends React.Component
{
    constructor() {
        super();
        this.state = {
            device: false,
            battery: false,
            services: [],
            characteristics: [],
            data: {},
            glucose_level: '--'
        }
        this.manager = new BleManager();
    }

    componentWillMount() {

        const subscription = this.manager.onStateChange((state) => {
            console.log(state)
            if (state === 'PoweredOn') {
                this.scan();
                subscription.remove();
            }
        }, true);
    }

    scan() {
        this.manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                // Handle error (scanning will be stopped automatically)
                return
            }

            // Check if it is a device you are looking for based on advertisement data
            // or other criteria.
            if (device.name === 'FORA 6 CONNECT') {
                this.setState({
                    "device": device
                })
                // Stop scanning as it's not necessary if you are scanning for one device.
                this.manager.stopDeviceScan();

                // Proceed with connection.
            }
        });
    }

    connect() {
        this.state.device.connect()
        .then((device) => {
            this.manager.discoverAllServicesAndCharacteristicsForDevice(device.id);
            return device.discoverAllServicesAndCharacteristics()
        })
        .then((device) => {
            device.services().then((services)=>{


                this.setState({
                    services: services
                }, () =>{
                    let dt = {};
                    this.state.services.map(service => {
                        dt[service.uuid] = {};
                        service.characteristics().then(characteristics => {

                            characteristics.map( characteristic => {
                                if(characteristic.uuid == "00002a52-0000-1000-8000-00805f9b34fb"){
                                    characteristic.writeWithResponse("AQ==").then((characteristic) =>{
                                        console.log(characteristic)
                                    });
                                }
                                //dt[service.uuid][characteristic.uuid] = ;
                                if (characteristic.isReadable) {
                                    characteristic.read().then(characteristic => {
                                        if(characteristic.uuid == ""){
                                            console.log("RECORDS================================")
                                        }
                                        console.log(characteristic)
                                    })
                                }
                            });

                        })
                    })
                })
            })

/*
            device.characteristicsForService("00001808-0000-1000-8000-00805f9b34fb")
                .then( characteristics => {
                    this.setState({
                        characteristics: characteristics
                    }, () =>{
                        this.state.characteristics.map(characteristic=>{
                            console.log(characteristic.uuid)
                            if(characteristic.isReadable && characteristic.uuid!="") {
                                characteristic.read().then(value=>{
                                    console.log(value)
                                }).catch(error=>{
                                    console.log(error)
                                })
                            }

                           if(characteristic.isNotifiable) {
                                characteristic.monitor((error, value) =>{
                                    console.log(value)
                                })
                            }
                        })
                    })
                });

*/
    /**
     * Get current glucose level
     */
/*
            device.monitorCharacteristicForService("00001808-0000-1000-8000-00805f9b34fb", "00002a18-0000-1000-8000-00805f9b34fb" , (error, characteristic) =>{
                this.setState({
                    glucose_level: characteristic
                });
            })*/

     /**
      * Get Patient Records
      */
/*
            device.readCharacteristicForService("00001808-0000-1000-8000-00805f9b34fb", "00002a52-0000-1000-8000-00805f9b34fb")
            .then(   characteristic =>{
                this.setState({
                    records: characteristic
                });
            })
*/

        }).then((services) =>{
            console.log(services)
        })
        .catch((error) => {
            // Handle errors
        });
    }



    render() {
        return <View>{!this.state.device &&
            <Text>Device not detected</Text>
        }
        {this.state.device &&
                    <View>
                    <Text>{this.state.device.name} READY</Text>
                    <Button title="Connect" onPress={()=>{
                        this.connect();
                    }}>Connect</Button>

                    <Text>Glucose Level: {this.state.glucose_level}</Text>
                    {this.state.characteristics.map ( characteristic => (
                        <Text key={characteristic.uuid}>{characteristic.uuid}</Text>
                    ))
                    }

                    </View>
                }
        </View>
    }

    decode_base64(s) {
        let b=l=0, r='',
            m='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        s.split('').forEach(function (v) {
            b=(b<<6)+m.indexOf(v); l+=6;
            if (l>=8) r+=String.fromCharCode((b>>>(l-=8))&0xff);
        });
        return r;
    }
}