import type { SpecType } from '../../../lib/fleet-options';

type TextInputProps = {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  step?: string;
  type?: SpecType | 'date';
};

export function TextInput({
  label,
  name,
  placeholder,
  required,
  step,
  type = 'text',
}: TextInputProps) {
  return (
    <label className="register-field">
      <span>{label}</span>
      <div className="register-input">
        <input
          min={type === 'number' ? '0' : undefined}
          name={name}
          placeholder={placeholder}
          required={required}
          step={step || (type === 'number' ? 'any' : undefined)}
          type={type}
        />
      </div>
    </label>
  );
}
