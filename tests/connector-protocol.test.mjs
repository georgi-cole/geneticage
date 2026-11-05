import assert from 'node:assert/strict';
import {test} from 'node:test';
import {invocationSchema,grantSchema,sessionOptionsSchema,driverMessageSchema} from '../scripts/connector-preview/protocol.mjs';

test('connector invocations retain arbitrary JSON arguments and reject caller-selected account/tool fields',()=>{
 const invocation={connectorId:'example',actionName:'read',arguments:{limit:3,filter:{name:'sample'},items:[1,null,'two']}};
 assert.deepEqual(invocationSchema.parse(invocation),invocation);
 assert.equal(invocationSchema.safeParse({...invocation,accountId:'another-account'}).success,false);
 assert.equal(invocationSchema.safeParse({...invocation,toolName:'write'}).success,false);
 for(const name of ['','white space','with/slash','control\u0000'])assert.equal(invocationSchema.safeParse({...invocation,connectorId:name}).success,false);
 assert.equal(grantSchema.safeParse({connectorId:'example',actionName:'write',readOnly:false}).success,false);
});

test('preview session limits use bounded positive durations and safe counts',()=>{
 assert.deepEqual(sessionOptionsSchema.parse({}),{timeoutMs:120000,maxConcurrent:64});
 for(const options of [{timeoutMs:0},{timeoutMs:2**31},{lifetimeMs:-1},{maxCalls:0},{maxConcurrent:1.5},{extra:true}])assert.equal(sessionOptionsSchema.safeParse(options).success,false);
});

test('driver success/error records validate under the installed Zod version',()=>{
 const id='123e4567-e89b-42d3-a456-426614174000';
 assert.deepEqual(driverMessageSchema.parse({jsonrpc:'2.0',id,result:{content:[{type:'text',text:'fixture'}]}}),{jsonrpc:'2.0',id,result:{content:[{type:'text',text:'fixture'}]}});
 assert.equal(driverMessageSchema.safeParse({jsonrpc:'2.0',id,error:{code:-32000,message:'Unavailable'}}).success,true);
 assert.equal(driverMessageSchema.safeParse({jsonrpc:'2.0',method:'stop'}).success,true);
 assert.equal(driverMessageSchema.safeParse({jsonrpc:'2.0',id:'invalid',result:{}}).success,false);
});
