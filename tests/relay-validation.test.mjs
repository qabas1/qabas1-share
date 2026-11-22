import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDigits,validate} from '../assets/relay-validation.js';

test('normalizes Arabic and Persian numerals and Arabic separators',()=>{
  assert.equal(normalizeDigits('۰١٢٬٣٤٥٫٦٧'),'012345.67');
});

test('validates required checkboxes and numeric bounds',()=>{
  assert.equal(validate({type:'boolean',required:true},{type:'checkbox',checked:false})[0],'هذا الحقل مطلوب.');
  assert.deepEqual(validate({type:'boolean',required:true},{type:'checkbox',checked:true}),['',true]);
  assert.deepEqual(validate({type:'integer',required:true,constraints:{min:1,max:999}},{type:'text',value:'۱۲'}),['','12']);
  assert.equal(validate({type:'integer',constraints:{min:1}},{type:'text',value:'۰'})[0],'أدخل رقمًا لا يقل عن 1.');
  assert.equal(validate({type:'integer',constraints:{max:9}},{type:'text',value:'١٠'})[0],'أدخل رقمًا لا يزيد على 9.');
});

test('validates decimal precision and date bounds',()=>{
  assert.equal(validate({type:'decimal',constraints:{scale:2}},{type:'text',value:'١٢٫٣٤٥'})[0],'تجاوز الرقم عدد الخانات المسموح به.');
  assert.equal(validate({type:'date',constraints:{min:'2026-01-01',max:'2026-12-31'}},{type:'date',value:'2025-12-31'})[0],'اختر تاريخًا لا يسبق 2026-01-01.');
});
