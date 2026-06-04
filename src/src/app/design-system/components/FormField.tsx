/**
 * FormField Component
 * 
 * Standardized form field with label, input, and error handling.
 * Provides consistent form UX across the application.
 * 
 * @component
 */

import { ReactNode } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

export interface FormFieldProps {
  /** Field label */
  label: string;
  
  /** Field name */
  name: string;
  
  /** Field type */
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "date" | "textarea" | "select";
  
  /** Field value */
  value: string | number;
  
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Error message */
  error?: string;
  
  /** Help text */
  helpText?: string;
  
  /** Required field */
  required?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Select options (for type="select") */
  options?: Array<{ value: string; label: string }>;
  
  /** Custom input component */
  customInput?: ReactNode;
  
  /** Rows for textarea */
  rows?: number;
  
  /** Custom className */
  className?: string;
}

/**
 * FormField component for standardized form inputs
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   name="email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   placeholder="john@example.com"
 *   required
 *   error={errors.email}
 *   helpText="We'll never share your email"
 * />
 * 
 * <FormField
 *   label="Department"
 *   name="department"
 *   type="select"
 *   value={department}
 *   onChange={(e) => setDepartment(e.target.value)}
 *   options={[
 *     { value: "engineering", label: "Engineering" },
 *     { value: "sales", label: "Sales" },
 *   ]}
 *   required
 * />
 * ```
 */
export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  helpText,
  required = false,
  disabled = false,
  options,
  customInput,
  rows = 4,
  className = "",
}: FormFieldProps) {
  const inputId = `field-${name}`;
  
  const renderInput = () => {
    if (customInput) {
      return customInput;
    }
    
    if (type === "textarea") {
      return (
        <Textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          className={error ? "border-red-500 focus:ring-red-500" : ""}
        />
      );
    }
    
    if (type === "select") {
      return (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select {label}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
    
    return (
      <Input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={error ? "border-red-500 focus:ring-red-500" : ""}
      />
    );
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {renderInput()}
      
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

export default FormField;
