import Parser from "./Parser";

export default class GlucoseMeasure {
    GLUCOSE_CONCENTRATION_UNIT_KG_L = 0;
    GLUCOSE_CONCENTRATION_UNIT_MOL_L = 1;
    value = {
        flags: {
            timeOffsetPresent: false, //Time Offset Present
            typeAndLocationPresent: false, //Glucose Concentration, Type and Sample Location Present
            glucoseConcentrationUnit: this.GLUCOSE_CONCENTRATION_UNIT_KG_L,
            sensorStatusAnunciationPresent: false,
            contextInformationFollows: false
        },
        sequence: 0,
        baseDateTime: false,
        timeOffset: false,
        glucose_concentration: {
            kg_L: 0,
            mol_L: 0
        },
        type: false,
        typeNumber: -1,
        location: false,
        locationNumber: -1,
        sensorStatus: {

        }
    }

    buffer = false;

    constructor(arrayBuffer) {
        this.buffer = arrayBuffer;
        this.parse();
    }
    parse() {
        let bytePos = 0;
        // GEt Flags
        this.value.flags.timeOffsetPresent = ((this.buffer[bytePos] | 0x7F)  === 0xFF)
        this.value.flags.typeAndLocationPresent = ((this.buffer[bytePos] | 0xBF)  === 0xFF)
        this.value.flags.glucoseConcentrationUnit = ((this.buffer[bytePos] | 0xDF)  === 0xFF)
        this.value.flags.sensorStatusAnunciationPresent   = ((this.buffer[bytePos] | 0xEF)  === 0xFF)
        this.value.flags.contextInformationFollows   = ((this.buffer[bytePos] | 0xF7)  === 0xFF)
        bytePos++;
        // Get Sequence Number
        this.value.sequence = new Uint16Array( this.buffer.slice(bytePos,3).buffer )[0];
        bytePos = bytePos+2;
        //Get Base Time Value
        let year = new Uint16Array( this.buffer.slice(bytePos,bytePos+2).buffer )[0];
        bytePos = bytePos+2;
        let month = new Uint8Array( this.buffer.slice(bytePos, bytePos+1).buffer )[0];
        bytePos++;
        let day = new Uint8Array( this.buffer.slice(bytePos,bytePos+1).buffer )[0];
        bytePos++;
        let hour = new Uint8Array( this.buffer.slice(bytePos,bytePos+1).buffer )[0];
        bytePos++;
        let minutes = new Uint8Array( this.buffer.slice(bytePos,bytePos+1).buffer )[0];
        bytePos++;
        let seconds = new Uint8Array( this.buffer.slice(bytePos,bytePos+1).buffer )[0];
        bytePos++;

        let baseDate = new Date(year, month, day, hour, minutes, seconds);

        this.value.baseDateTime = baseDate;

        // Get timeoffset
        if(this.value.flags.timeOffsetPresent) {
            //Last Line after offset
            bytePos = bytePos+2;
        }

        // Get
        if(this.value.flags.typeAndLocationPresent || this.value.flags.glucoseConcentrationUnit == this.GLUCOSE_CONCENTRATION_UNIT_KG_L) {
            this.value.glucose_concentration.kg_L = new Uint8Array( this.buffer.slice(bytePos+2,bytePos+3).buffer )[0];
            bytePos = bytePos+2;
        }

        // Get
        if(this.value.typeAndLocationPresent || this.value.flags.glucoseConcentrationUnit == this.GLUCOSE_CONCENTRATION_UNIT_MOL_L) {
            this.value.glucose_concentration.mol_L =  new Uint8Array( this.buffer.slice(bytePos+2,bytePos+3).buffer )[0];
            bytePos = bytePos+2;
        }

        if(this.value.flags.typeAndLocationPresent) {
            let val = new Uint8Array( this.buffer.slice(bytePos,bytePos+1).buffer )[0]
            //Get Type
            let n1 = this.buffer[bytePos] & 0x0F;
            this.value.typeNumber = n1;
            let n2 = this.buffer[bytePos] >> 4;
            this.value.locationNumber = n2;
            switch (n1) {
                case 1:
                    this.value.type = "Reserved for future use";
                    break;
                case 2:
                    this.value.type = "Capillary Whole blood";
                    break;
                case 3:
                    this.value.type = "Capillary Plasma";
                    break;
                case 4:
                    this.value.type = "Venous Whole blood";
                    break;
                case 5:
                    this.value.type = "Venous Plasma";
                    break;
                case 6:
                    this.value.type = "Arterial Whole blood";
                    break;
                case 7:
                    this.value.type = "Arterial Plasma";
                    break;
                case 8:
                    this.value.type = "Undetermined Whole blood";
                    break;
                case 9:
                    this.value.type = "Undetermined Plasma";
                    break;
                case 10:
                    this.value.type = "Interstitial Fluid (ISF)";
                    break;
                default:
                    this.value.type = "Control Solution";
            }

            switch (n2) {
                case 1:
                    this.value.type = "Finger";
                    break;
                case 2:
                    this.value.type = "Alternate Site Test (AST)";
                    break;
                case 3:
                    this.value.type = "Earlobe";
                    break;
                case 4:
                    this.value.type = "Control solution";
                    break;
                case 5:
                    this.value.type = "Sample Location value not available";
                    break;
                default:
                    this.value.type = "Control Solution";
            }
            bytePos++;
        }

        // Get Status Notification
        if(this.value.flags.sensorStatusAnunciationPresent) {
            let status = new Uint16Array(this.buffer.slice(bytePos, bytePos + 2).buffer)[0];
            this.value.sensorStatus = status;
        }

        console.log(this.buffer);
    }

    getValue() {
        return this.value
    }

    setValue(measure) {
        this.value = measure;
    }

    floatFromTwosComplementUInt16(value, bitsInValueIncludingSign)  {
        // calculate a signed float from a two's complement signed value
        // represented in the lowest n ("bitsInValueIncludingSign") bits
        // of the UInt16
        let a = new Uint16Array(1);
        a[0] = 0x1
        let signMask = a[0] << (bitsInValueIncludingSign - 1)

        let signMultiplier =  (value & signMask == 0) ? 1.0 : -1.0;



        let valuePart = value;

        if (signMultiplier < 0) {
            // Undo two's complement if it's negative
            let b = new Uint16Array(1);
            b[0] = 0x1
            for (let i=0; i< bitsInValueIncludingSign - 2;i++) {
                b[0] = b[0] << 1
            }

            b[0] += 1
            valuePart = ((~value) & b[0]) + 1
        }


        let floatValue = valuePart * signMultiplier

        return floatValue
    }

    extractSFloat(bytePos) {
            let arr = new Uint16Array(this.buffer.slice(bytePos, bytePos + 2).buffer);
            //let arr = new Uint16Array(2);
            arr[0] =8
            arr[1] = 176
            console.log(arr)
        let full = arr[1]*256 + arr[0];
        console.log(full);
        if (full == 0x07FF) {
            return NaN
        } else if (full == 0x800) {
            return NaN // This is really NRes, "Not at this Resolution"
        } else if (full == 0x7FE) {
            return Infinity
        } else if (full == 0x0802) {
            return -Infinity// This is really negative infinity
        } else if (full == 0x801) {
            return NaN // This is really RESERVED FOR FUTURE USE
        }

        let expo = (full & 0xF000) >> 12;
        console.log(expo)
        let expoFloat = this.floatFromTwosComplementUInt16(expo, 4)
        console.log(expoFloat)
        let mantissa = full & 0x0FFF
        console.log(mantissa)
        let mantissaFloat = this.floatFromTwosComplementUInt16(expo, 12)
        console.log(mantissaFloat)
        let finalValue = mantissaFloat * Math.pow(10.0, expoFloat)
        console.log(finalValue)
        return finalValue
    }

}
