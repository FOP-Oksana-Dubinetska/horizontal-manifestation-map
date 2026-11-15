#include "localization.hpp"
#include "locale-resources.hpp"
#include <stdexcept>
namespace roadmap::formats {
const nlohmann::json &locale(const std::string &language) {
	static const auto en = nlohmann::json::parse(localeEn);
	static const auto uk = nlohmann::json::parse(localeUk);
	static const auto ru = nlohmann::json::parse(localeRu);
	if (language == "en")
		return en;
	if (language == "uk")
		return uk;
	if (language == "ru")
		return ru;
	throw std::invalid_argument("Supported languages: en, uk, ru");
}
} // namespace roadmap::formats
