export function normalizeDigits(value) {
  return value
    .replace(/[\u0660-\u0669\u06f0-\u06f9]/g, digit => {
      const code = digit.charCodeAt(0);
      return String(code >= 0x6f0 ? code - 0x6f0 : code - 0x660);
    })
    .replace(/\u066b/g, '.')
    .replace(/\u066c/g, '');
}

export function validate(field, input) {
  let value = input.type === 'checkbox' ? input.checked : input.value.trim();
  const constraints = field.constraints || {};

  if (field.required && (input.type === 'checkbox' ? !value : value === '')) {
    return [field.errorMessage || 'هذا الحقل مطلوب.', value];
  }

  if (field.type === 'decimal' || field.type === 'integer') {
    value = normalizeDigits(value);
    if (!value) return ['', value];

    const decimal = field.type === 'decimal';
    const pattern = decimal ? /^-?\d+(?:\.\d+)?$/ : /^-?\d+$/;
    if (!pattern.test(value)) return ['أدخل رقمًا صحيحًا.', value];

    const digits = value.replace('-', '').replace('.', '');
    const fraction = value.split('.')[1] || '';
    if (digits.length > (constraints.precision ?? 18) || (decimal && fraction.length > (constraints.scale ?? 2))) {
      return ['تجاوز الرقم عدد الخانات المسموح به.', value];
    }

    const numericValue = Number(value);
    if (typeof constraints.min === 'number' && numericValue < constraints.min) {
      return [`أدخل رقمًا لا يقل عن ${constraints.min}.`, value];
    }
    if (typeof constraints.max === 'number' && numericValue > constraints.max) {
      return [`أدخل رقمًا لا يزيد على ${constraints.max}.`, value];
    }
  }

  if (field.type === 'date' && value) {
    if (typeof constraints.min === 'string' && value < constraints.min) {
      return [`اختر تاريخًا لا يسبق ${constraints.min}.`, value];
    }
    if (typeof constraints.max === 'string' && value > constraints.max) {
      return [`اختر تاريخًا لا يتجاوز ${constraints.max}.`, value];
    }
  }

  if (typeof value === 'string' && constraints.minLength && value.length < constraints.minLength) {
    return ['الإجابة أقصر من الحد المطلوب.', value];
  }
  if (typeof value === 'string' && constraints.maxLength && value.length > constraints.maxLength) {
    return ['الإجابة أطول من الحد المسموح.', value];
  }
  return ['', value];
}
