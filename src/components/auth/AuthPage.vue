<template>
	<div class="auth-page">
	  <div class="auth-container">
		<div class="logo">
		  <h1>Media Tracker</h1>
		  <p>Track your favorite movies, books, and games</p>
		</div>
		<div class="forms-wrapper">
		  <!-- Форма регистрации -->
		  <SignUpForm
			v-if="isSignUp"
			@switch-to-signin="isSignUp = false"
		  />

		  <!-- Форма входа -->
		  <SignInForm
			v-else
			@switch-to-signup="isSignUp = true"
		  />
		</div>
	  </div>
	</div>
  </template>

  <script setup lang="ts">
  import { ref } from 'vue'
  import SignUpForm from '@/components/auth/SignUpForm.vue'
  import SignInForm from '@/components/auth/SignInForm.vue'

  /**
   * Состояние переключения между формами
   * true = форма регистрации, false = форма входа
   */
  const isSignUp = ref(true)
  </script>

  <style scoped>
  .auth-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 1rem;
  }

  .auth-container {
	background: white;
	border-radius: 1rem;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
				0 10px 10px -5px rgba(0, 0, 0, 0.04);
	overflow: hidden;
	max-width: 500px;
	width: 100%;
  }

  .logo {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 2rem;
	text-align: center;
  }

  .logo h1 {
	font-size: 2rem;
	font-weight: 700;
	margin: 0 0 0.5rem 0;
  }

  .logo p {
	margin: 0;
	opacity: 0.9;
	font-size: 1rem;
  }

  .forms-wrapper {
	padding: 0;
  }
  </style>
