"use client";

import styles from "./personal.module.css";
import { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import { authClient } from "@/lib/auth/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  }
};

export default function PersonalSettingsPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const { data, error } = await authClient.getSession();
        if (!mounted) return;
        if (error || !data?.user) {
          console.error("Failed to get session:", error);
          return;
        }
        setUsername(data.user.name ?? "");
        setEmail(data.user.email ?? "");
        setOriginalUsername(data.user.name ?? "");
        setOriginalEmail(data.user.email ?? "");
        setEmailVerified(data.user.emailVerified ?? false);
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleResendVerification() {
    if (resendCooldown > 0 || isSendingVerification) return;
    
    setIsSendingVerification(true);
    try {
      await authClient.sendVerificationEmail({
        email: email,
        callbackURL: "/dashboard/settings/personal",
      });
      setMessage({ type: "success", text: "Verification email sent! Check your inbox." });
      setResendCooldown(60);
    } catch (err) {
      console.error("Error sending verification email:", err);
      setMessage({ type: "error", text: "Failed to send verification email" });
    } finally {
      setIsSendingVerification(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      // Update name if changed
      if (username !== originalUsername) {
        const { error } = await authClient.updateUser({
          name: username,
        });
        if (error) {
          setMessage({ type: "error", text: "Failed to update name" });
          setIsSaving(false);
          return;
        }
        setOriginalUsername(username);
      }

      // Update email if changed
      if (email !== originalEmail) {
        const { error } = await authClient.changeEmail({
          newEmail: email,
        });
        if (error) {
          setMessage({
            type: "error",
            text: error.message || "Failed to update email",
          });
          setIsSaving(false);
          return;
        }
        setOriginalEmail(email);
        setEmailVerified(false); // Email needs to be re-verified
        setMessage({
          type: "success",
          text: "Email updated. Please check your inbox to verify.",
        });
      } else if (username !== originalUsername) {
        setMessage({ type: "success", text: "Profile updated successfully" });
      }
    } catch (err) {
      console.error("Error saving:", err);
      setMessage({ type: "error", text: "An error occurred while saving" });
    } finally {
      setIsSaving(false);
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Handle file upload when API is ready
      console.log("Selected file:", file.name);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await authClient.deleteUser();
      router.push("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      setMessage({ type: "error", text: "Failed to delete account" });
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.personalContainer}>
        <h1>Personal</h1>
        <hr />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className={styles.personalContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants}>Personal</motion.h1>
      <motion.hr variants={itemVariants} />
      <div className={styles.contentWrapper}>
        <motion.form 
          onSubmit={handleSubmit} 
          className={styles.formSection}
          variants={containerVariants}
        >
        <motion.label variants={itemVariants}>Username</motion.label>
        <motion.input
          variants={itemVariants}
          type="text"
          value={username}
          onChange={(val) => setUsername(val.target.value)}
        />
        <motion.label variants={itemVariants}>Email</motion.label>
        <motion.input
          variants={itemVariants}
          type="email"
          value={email}
          onChange={(val) => setEmail(val.target.value)}
        />
          <div className={styles.emailStatusRow}>
        <span className={styles.emailStatus}>
          {emailVerified ? "Email verified" : "Email not verified"}
        </span>
            {!emailVerified && (
              <button
                type="button"
                className={styles.resendButton}
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || isSendingVerification}
              >
                {isSendingVerification
                  ? "Sending..."
                  : resendCooldown > 0
                  ? `Resend (${resendCooldown}s)`
                  : "Resend verification"}
              </button>
            )}
          </div>
        {message && (
          <p
            className={
              message.type === "success" ? styles.success : styles.error
            }
          >
            {message.text}
          </p>
        )}
        <motion.div variants={itemVariants}>
          <PrimaryButton type="submit" id={styles.submitbutton} disabled={isSaving}>
            <span className="textGradient">
              {isSaving ? "Saving..." : "Save"}
            </span>
          </PrimaryButton>
        </motion.div>
      </motion.form>

        <motion.div 
          className={styles.profileCard}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className={styles.profileImageWrapper} onClick={handleProfileClick}>
            <div className={styles.profileImage}>
              <Image
                src="/dashboard/UserIcon.svg"
                width={2000}
                height={2000}
                alt="Profile"
                className={styles.profilePic}
              />
            </div>
            <div className={styles.profileOverlay}>
              <Image
                src="/settings/edit.svg"
                width={2000}
                height={2000}
                alt="Edit"
                className={styles.editIcon}
              />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className={styles.fileInput}
            />
          </div>
          <span className={styles.profileUsername}>{username}</span>
        </motion.div>
      </div>

      <motion.button
        className={styles.deleteAccountButton}
        onClick={() => setShowDeleteModal(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Delete Account
      </motion.button>

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModal}>
            <h3>Delete Account?</h3>
            <p>
              This action is <strong>permanent</strong> and cannot be undone.
              All your data will be deleted.
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteButton}
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
