import React, { HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLButtonElement> {
  label: string
}

function Button({ label, ...props }: Props) {
  return (
    <button
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      type="button"
    >
      <h4>{label}</h4>
    </button>
  );
}
export default Button;
