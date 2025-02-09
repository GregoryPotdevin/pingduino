import { Slider } from "@mui/material";

import { SliderProps, Typography } from "@mui/material";

type LabeledSliderProps = SliderProps & { label: string };

const LabeledSlider = ({ label, ...props }: LabeledSliderProps) => {
  return (
    <div>
      <Typography>{label}</Typography>
      <Slider {...props} />
    </div>
  );
};

export default LabeledSlider;
