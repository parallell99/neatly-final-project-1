"use client";

const VARIANT_CLASS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

function Button({
  buttonStyle,
  className: classNameProp,
  type = "button",
  onClick,
  disabled,
  style,
  icon: Icon,
  buttonText,
  ...rest
}) {
  const variant = VARIANT_CLASS[buttonStyle] ?? `${classNameProp}`;
  const className = ["btn", variant, classNameProp].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={style}
      {...rest}
    >
      {Icon && (
        <Icon
          size={24}
          strokeWidth={1.5}
          className="shrink-0 relative -top-px"
        />
      )}
      {buttonText}
    </button>
  );
}
export default Button;
