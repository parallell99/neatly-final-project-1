"use client";

const VARIANT_CLASS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

function Button(props) {
  const variant = VARIANT_CLASS[props.buttonStyle] ?? `${props.className}`;
  const className = ["btn", variant, props.className].filter(Boolean).join(" ");
    
  return (
    <button
      type={props.type}
      onClick={props.onClick}
      disabled={props.disabled}
      className={className}
      style={props.style}
    >
      {props.icon && (
        <props.icon
          size={24}
          strokeWidth={1.5}
          className="shrink-0 relative -top-px"
        />
      )}
      {props.buttonText}
    </button>
  );
}
export default Button;
