import React from 'react';
import { StyleSheet, Text, View, Button, Picker } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import Parser from "./Parser";

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
            glucose_level: '--',
            connected: false,
            acquiringServices: false,
            servicesAcquired: false,
            devices: [],
            records: []
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



    searchForServices() {
        let device = this.state.device;
        device.discoverAllServicesAndCharacteristics()
        .then((device) => {
            this.setState({
                device: device,
                acquiringServices: true
            })
            return device.services();
        }).then((services) => {
            console.log(services)
            device.monitorCharacteristicForService("00001808-0000-1000-8000-00805f9b34fb", "00002a52-0000-1000-8000-00805f9b34fb" , (error, characteristic) =>{
                this.setState({
                    glucose_level: characteristic.value
                });

                alert(Parser.parse(characteristic.value).msg)

            });

            device.monitorCharacteristicForService("00001808-0000-1000-8000-00805f9b34fb", "00002a18-0000-1000-8000-00805f9b34fb" , (error, characteristic) =>{
                let record = Parser.parseMessage(characteristic.value)
                let records = [...this.state.records]
                records.push(record);
                this.setState({
                    records: records
                })
            });

            device.monitorCharacteristicForService("00001808-0000-1000-8000-00805f9b34fb", "00002a34-0000-1000-8000-00805f9b34fb" , (error, characteristic) =>{
                Parser.parseMessage(characteristic.value)
                console.log(characteristic.value)
            });
            this.setState({
                device: device,
                acquiringServices: false,
                servicesAcquired: true,
                services: services
            })
        })
    }

    getAllRecords() {
        this.callRecordsAccessControlPoint("AQE=")
    }

    getFirstRecord() {
        this.callRecordsAccessControlPoint("AQMBAQI=")
    }

    getLastRecord() {
        this.callRecordsAccessControlPoint("AQY=")
    }

    getCharacteristicByUuids( serviceUUID, characteristicUUID) {
        device.getCharacteristicByUuids(serviceUUID, characteristicUUID)
            .then(characteristic => {
                if(characteristic.isReadable){
                    characteristic.read().then(value => {

                        // Handle this value
                        console.log(value);
                    })
                }
            })

    }

    callRecordsAccessControlPoint( val ) {
        let services = this.state.services;
        services.map(service => {
            service.characteristics().then(characteristics => {

                characteristics.map( characteristic => {
                    if(characteristic.uuid == "00002a52-0000-1000-8000-00805f9b34fb"){
                        characteristic.writeWithResponse(val).then((characteristic) =>{
                            console.log(characteristic)
                        });
                    } else if(characteristic.isReadable) {
                        characteristic.read().then(characteristic => {
                            console.log(characteristic.value)
                        })
                    }
                });

            })
        })
    }

    connect() {
        this.state.device.connect()
        .then((device) => {
            this.setState({
                connected: true,
                device: device
            });
        }).catch((error) => {
            // Handle errors
        });
    }



    render() {
        console.log(this.state.records)
        return (
            <View>
                {!this.state.device &&
                    <Text>Device not detected</Text>
                }
                {this.state.device &&
                <View>
                    <Text>{this.state.device.name} READY</Text>

                    {!this.state.connected &&
                    <Button title="Connect" onPress={()=>{
                        this.connect();
                    }}>Connect</Button>
                    }

                    {this.state.connected &&
                    <Button title="Search For Services" onPress={()=>{
                        this.searchForServices();
                    }}>Search For Services</Button>
                    }

                    {this.state.connected && this.state.servicesAcquired &&
                    <View>
                        <Button title="Get All Records" onPress={()=>{
                            this.getAllRecords();
                        }}>All records</Button>
                        <Button title="First record" onPress={()=>{
                            this.getAllRecords();
                        }}>First record</Button>
                        <Button title="Last record" onPress={()=>{
                            this.getAllRecords();
                        }}>Last record</Button>
                    </View>
                    }

                    <Text>Glucose Level: {this.state.glucose_level}</Text>
                    {this.state.characteristics.map ( characteristic => (
                        <Text key={characteristic.uuid}>{characteristic.uuid}</Text>
                    ))
                    }

                    {this.state.records && this.state.records.map ( record => (
                        <View key={Math.random()}>
                            <Text>Value: {record.value.glucose_concentration.kg_L} mg/dL</Text>

                        </View>
                    ))
                    }

                </View>
                }
            </View>
        )
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