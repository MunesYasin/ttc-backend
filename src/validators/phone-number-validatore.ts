import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsKsaMobile(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isKsaMobile',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          const regex = /^(009665|9665|\+9665|05|5)\d{8}$/;
          return typeof value === 'string' && regex.test(value);
        },
        defaultMessage(): string {
          return 'رقم الجوال غير صالح. يجب أن يكون رقمًا سعوديًا بصيغة صحيحة.';
        },
      },
    });
  };
}
