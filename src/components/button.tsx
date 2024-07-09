import clsx from "clsx";
import { createContext, ReactNode, useContext } from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  TextProps,
} from "react-native";

type Variants = "primary" | "secondary";

type ButtonProps = PressableProps & {
  variant?: Variants;
  isLoading?: boolean;
  children: ReactNode; // Defina explicitamente o tipo de children como ReactNode
};

const ThemeContext = createContext<{ variant?: Variants }>({});

function Button({
  variant = "primary",
  children,
  isLoading,
  className,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      className={clsx(
        "h-11 flex-row items-center justify-center rounded-lg gap-2 px-2",
        {
          "bg-lime-300": variant === "primary",
          "bg-zinc-800": variant === "secondary",
        },
        className
      )}
      disabled={isLoading}
      {...rest}
    >
      <ThemeContext.Provider value={{ variant }}>
        {isLoading ? <ActivityIndicator className="text-lime-950" /> : children}
      </ThemeContext.Provider>
    </Pressable>
  );
}

function Title({ children }: TextProps) {
  const { variant } = useContext(ThemeContext);

  return (
    <Text
      className={clsx("text-base font-semibold", {
        "text-lime-950": variant === "primary",
        "text-zinc-200": variant === "secondary",
      })}
    >
      {children}
    </Text>
  );
}

Button.Title = Title;

export { Button };
