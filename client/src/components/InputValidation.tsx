import { useState, useEffect } from 'react';

interface InputValidationProps {
  value: string;
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
  onValidationChange?: (isValid: boolean, message: string) => void;
  showValidation?: boolean;
}

export default function InputValidation({ 
  value, 
  rules, 
  onValidationChange,
  showValidation = true 
}: InputValidationProps) {
  const [isValid, setIsValid] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    validateInput();
  }, [value]);

  const validateInput = () => {
    let validationMessage = '';
    let valid = true;

    // Required validation
    if (rules.required && !value.trim()) {
      validationMessage = '필수 입력 항목입니다';
      valid = false;
    }
    
    // Min length validation
    else if (rules.minLength && value.length < rules.minLength) {
      validationMessage = `최소 ${rules.minLength}자 이상 입력해주세요`;
      valid = false;
    }
    
    // Max length validation
    else if (rules.maxLength && value.length > rules.maxLength) {
      validationMessage = `최대 ${rules.maxLength}자까지 입력 가능합니다`;
      valid = false;
    }
    
    // Pattern validation
    else if (rules.pattern && value && !rules.pattern.test(value)) {
      validationMessage = '올바른 형식으로 입력해주세요';
      valid = false;
    }
    
    // Custom validation
    else if (rules.custom && value) {
      const customMessage = rules.custom(value);
      if (customMessage) {
        validationMessage = customMessage;
        valid = false;
      }
    }

    setIsValid(valid);
    setMessage(validationMessage);
    
    if (onValidationChange) {
      onValidationChange(valid, validationMessage);
    }
  };

  if (!showValidation || !message) {
    return null;
  }

  return (
    <div className={`mt-1 text-xs flex items-center ${isValid ? 'text-green-600' : 'text-red-600'}`}>
      <i className={`fas ${isValid ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`} />
      {message}
    </div>
  );
}

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[0-9]{10,11}$/,
  ntrp: /^[1-7](\.[0-5])?$/,
  username: /^[a-zA-Z0-9가-힣_]{2,20}$/,
};

// Common validation rules
export const validationRules = {
  username: {
    required: true,
    minLength: 2,
    maxLength: 20,
    pattern: validationPatterns.username,
    custom: (value: string) => {
      if (value.includes('admin') || value.includes('관리자')) {
        return '사용할 수 없는 닉네임입니다';
      }
      return null;
    }
  },
  ntrp: {
    required: true,
    pattern: validationPatterns.ntrp,
    custom: (value: string) => {
      const num = parseFloat(value);
      if (num < 1.0 || num > 7.0) {
        return 'NTRP는 1.0-7.0 사이의 값이어야 합니다';
      }
      return null;
    }
  },
  bio: {
    maxLength: 200,
  },
  postTitle: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  postContent: {
    required: true,
    minLength: 10,
    maxLength: 1000,
  }
};