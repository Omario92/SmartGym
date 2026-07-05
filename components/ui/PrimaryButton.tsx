/**
 * PrimaryButton / SecondaryButton — opinionated wrappers over <Button> so
 * screens stop hand-rolling CTAs. They lock the variant and default to
 * fullWidth + large size for the "main action" pattern, while still forwarding
 * every other Button prop (loading, icon, onPress, style, size, …).
 *
 *   <PrimaryButton title="Start Workout" onPress={…} />
 *   <SecondaryButton title="Cancel" onPress={…} />
 */
import React from 'react';
import { Button } from './Button';

type ButtonProps = React.ComponentProps<typeof Button>;
type WrapperProps = Omit<ButtonProps, 'variant'>;

export const PrimaryButton: React.FC<WrapperProps> = ({
  size = 'lg',
  fullWidth = true,
  ...props
}) => <Button variant="primary" size={size} fullWidth={fullWidth} {...props} />;

export const SecondaryButton: React.FC<WrapperProps> = ({
  size = 'lg',
  fullWidth = true,
  ...props
}) => <Button variant="secondary" size={size} fullWidth={fullWidth} {...props} />;
