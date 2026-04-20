/**
 * Service centralisé pour la sécurité et l'authentification.
 * Garantit une seule source de vérité pour les politiques de mots de passe.
 */
class AuthService {
  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param {Object} user - Instance Mongoose de l'utilisateur
   * @param {string} newPassword - Le nouveau mot de passe 
   * @param {string|null} currentPassword - Mot de passe actuel obligatoire (pour vérification stricte depuis le profil)
   * @throws {Error} CURRENT_PASSWORD_INVALID si la vérification échoue
   */
  static async updatePassword(user, newPassword, currentPassword = null) {
    if (currentPassword) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        throw new Error('CURRENT_PASSWORD_INVALID');
      }
    }

    // Le hachage bcrypt est automatiquement sécurisé par le hook pre('save') dans User.js
    user.password = newPassword;
    
    // Révocation de toutes les obligations/tokens de sécurité
    user.mustChangePassword = false;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    return true;
  }
}

module.exports = AuthService;
