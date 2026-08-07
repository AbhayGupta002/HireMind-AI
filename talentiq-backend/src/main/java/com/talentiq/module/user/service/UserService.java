package com.talentiq.module.user.service;

import com.talentiq.module.user.dto.UserDto;

public interface UserService {

    UserDto.Response getUserProfile(Long userId);

    UserDto.Response updateUserProfile(Long userId, UserDto.UpdateProfileRequest request);

    void changePassword(Long userId, UserDto.ChangePasswordRequest request);
}
