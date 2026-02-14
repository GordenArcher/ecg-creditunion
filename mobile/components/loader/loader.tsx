import React from "react";
import { ActivityIndicator } from "react-native";
import { styled } from "styled-components/native";

const Loader = () => {
  return (
    <Wrapper>
      <ActivityIndicator size="large" color="#fff" />
    </Wrapper>
  );
};

const Wrapper = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #000; /* black background */
`;

export default Loader;
