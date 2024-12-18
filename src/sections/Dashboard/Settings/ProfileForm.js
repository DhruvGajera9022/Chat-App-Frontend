import React, { useCallback, useEffect, useState } from "react";
import * as Yup from "yup";
// form
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import FormProvider from "../../../components/hook-form/FormProvider";
import { RHFTextField, RHFUploadAvatar } from "../../../components/hook-form";
import { Stack } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useDispatch, useSelector } from "react-redux";
import { UpdateUserProfile } from "../../../redux/slices/app";
import { AWS_S3_REGION, S3_BUCKET_NAME } from "../../../config";
import axios from "../../../utils/axios";

const ProfileForm = () => {
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const { user } = useSelector((state) => state.app);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:3001/user/get-me", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        dispatch({ type: "app/fetchUser", payload: { user: response.data.data } });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [dispatch]);

  const ProfileSchema = Yup.object().shape({
    firstName: Yup.string().required("Name is required"),
    about: Yup.string().required("About is required"),
    avatar: Yup.mixed().nullable(),
  });

  const methods = useForm({
    resolver: yupResolver(ProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      about: user?.about || "",
      avatar: user?.avatar || null,
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
  } = methods;

  const onSubmit = async (data) => {
    try {
      const payload = {
        firstName: data.firstName,
        about: data.about,
        avatar: file || user?.avatar,
      };
      dispatch(UpdateUserProfile(payload));
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const uploadedFile = acceptedFiles[0];
      if (uploadedFile) {
        setFile(uploadedFile);
        const previewFile = Object.assign(uploadedFile, {
          preview: URL.createObjectURL(uploadedFile),
        });
        setValue("avatar", previewFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        <RHFUploadAvatar
          name="avatar"
          maxSize={3145728}
          onDrop={handleDrop}
          avatarUrl={file ? file.preview : user?.avatar} // Show uploaded or existing avatar
        />

        <RHFTextField
          helperText="This name is visible to your contacts"
          name="firstName"
          label="First Name"
        />

        <RHFTextField
          multiline
          rows={4}
          name="about"
          label="About"
        />

        <Stack direction="row" justifyContent="flex-end">
          <LoadingButton
            color="primary"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting || isSubmitSuccessful}
          >
            Save
          </LoadingButton>
        </Stack>
      </Stack>
    </FormProvider>
  );
};

export default ProfileForm;
