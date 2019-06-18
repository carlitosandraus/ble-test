import atob from 'atob';
import {toByteArray} from 'base64-js';
import GlucoseMeasure from './GlucoseMeasure';

export default class Parser {

    static OP_CODE_REPORT_STORED_RECORDS = 1;
    static OP_CODE_DELETE_STORED_RECORDS = 2;
    static OP_CODE_ABORT_OPERATION = 3;
    static OP_CODE_REPORT_NUMBER_OF_RECORDS = 4;
    static OP_CODE_NUMBER_OF_STORED_RECORDS_RESPONSE = 5;
    static OP_CODE_RESPONSE_CODE = 6;

    static OPERATOR_NULL = 0;
    static  OPERATOR_ALL_RECORDS = 1;
    static OPERATOR_LESS_THEN_OR_EQUAL = 2;
    static OPERATOR_GREATER_THEN_OR_EQUAL = 3;
    static OPERATOR_WITHING_RANGE = 4;
    static OPERATOR_FIRST_RECORD = 5;
    static OPERATOR_LAST_RECORD = 6;

    static RESPONSE_SUCCESS = 1;
    static RESPONSE_OP_CODE_NOT_SUPPORTED = 2;
    static RESPONSE_INVALID_OPERATOR = 3;
    static RESPONSE_OPERATOR_NOT_SUPPORTED = 4;
    static RESPONSE_INVALID_OPERAND = 5;
    static RESPONSE_NO_RECORDS_FOUND = 6;
    static RESPONSE_ABORT_UNSUCCESSFUL = 7;
    static RESPONSE_PROCEDURE_NOT_COMPLETED = 8;
    static RESPONSE_OPERAND_NOT_SUPPORTED = 9;

    static base64ToArrayBuffer(base64) {
        var binary_string =  atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array( len );
        for (var i = 0; i < len; i++)        {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    static parse(value) {
        let response = {
            opcode: false,
            records_count: 0,
            msg: '',
            target: false,
            value: false
        }


        let val = toByteArray(value);

        let opCode = Parser.getInt8Value(val, 0);
        let operator = Parser.getInt8Value(val, 1);

        switch (opCode) {
            case Parser.OP_CODE_REPORT_STORED_RECORDS:
            case Parser.OP_CODE_DELETE_STORED_RECORDS:
            case Parser.OP_CODE_ABORT_OPERATION:
            case Parser.OP_CODE_REPORT_NUMBER_OF_RECORDS:
                response.opcode = Parser.getOpCode(opCode)
                response.msg = response.opcode + '\n';
                break;
            case Parser.OP_CODE_NUMBER_OF_STORED_RECORDS_RESPONSE: {
                response.opcode = Parser.getOpCode(opCode);
                response.records_count = Parser.getInt16Value(val,2);
                response.msg = response.opcode + '='+response.records_count+'\n'
                break;
            }
            case Parser.OP_CODE_RESPONSE_CODE: {
                response.opcode = Parser.getOpCode(opCode);
                response.msg = response.opcode + " for "
                response.target = Parser.getInt8Value(val, 2);
                response.msg = response.msg + Parser.getOpCode(response.target + ':');
                response.value = Parser.getInt8Value(val, 3);
                response.msg = response.msg + response.value + '\n';
                break;
            }
        }
        return response;
    }

    static getInt8Value(val, pos) {
        let arr = new Int8Array(val);
        return arr[pos]
    }

    static getInt16Value(val, pos) {
        let arr = new Int16Array(val);
        return arr[pos]
    }

    static getOpCode(opCode) {
        switch (opCode) {
        case Parser.OP_CODE_REPORT_STORED_RECORDS:
                return "Report stored records";
        case Parser.OP_CODE_DELETE_STORED_RECORDS:
                return "Delete stored records";
        case Parser.OP_CODE_ABORT_OPERATION:
                return "Abort operation";
        case Parser.OP_CODE_REPORT_NUMBER_OF_RECORDS:
                return "Report number of stored records";
        case Parser.OP_CODE_NUMBER_OF_STORED_RECORDS_RESPONSE:
                return "Number of stored records response";
        case Parser.OP_CODE_RESPONSE_CODE:
                return "Response Code";
        default:
            return "Reserved for future use";
        }
    }

    static parseMessage(value) {
        let val = toByteArray(value);
        let measure = new GlucoseMeasure(val);
       return measure;
    }

}